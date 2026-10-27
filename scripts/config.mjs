import Ajv from "ajv";
import { format } from "prettier";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { cli, isMain } from "./lib.mjs";
const ajv = new Ajv({ allErrors: true });
const schema = JSON.parse(
  readFileSync(
    new URL("../schemas/universal-app.schema.json", import.meta.url),
  ),
);
const provenanceSchema = JSON.parse(
  readFileSync(new URL("../schemas/provenance.schema.json", import.meta.url)),
);
const configValidator = ajv.compile(schema),
  provenanceValidator = ajv.compile(provenanceSchema);
/** Reject unknown/secret fields without printing supplied values. */
export function validateConfig(config, provenance) {
  if (!configValidator(config))
    throw new Error(
      "Invalid non-secret app configuration; compare with schemas/universal-app.schema.json. Values are not logged.",
    );
  for (const key of ["supportUrl", "websiteUrl"]) {
    let url;
    try {
      url = new URL(config[key]);
    } catch {
      throw new Error("Invalid public URL: " + key);
    }
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error("Use credential-free HTTPS public URLs.");
  }
  if (
    config.appId
      .split(".")
      .some((part) =>
        [
          "class",
          "package",
          "public",
          "private",
          "int",
          "void",
          "null",
          "new",
          "default",
          "static",
          "import",
        ].includes(part),
      )
  )
    throw new Error("Native identifier contains a Java reserved word.");
  if (provenance) {
    if (!provenanceValidator(provenance))
      throw new Error("Invalid non-secret provenance metadata.");
    if (config.appId !== provenance.initializedAppId)
      throw new Error(
        "Native identifier changed. Use identity:plan for a reviewed migration; config:sync will not silently rename projects.",
      );
  }
  return config;
}
export function loadConfig() {
  return validateConfig(
    JSON.parse(readFileSync("universal-app.config.json")),
    JSON.parse(readFileSync(".universal-app.json")),
  );
}
const xml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export async function syncConfig({ dryRun = false } = {}) {
  const config = loadConfig();
  const pending = new Map();
  const update = (path, next) => {
    const previous = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (next !== previous) {
      pending.set(path, next);
    }
  };
  const json = (path, transform) => {
    const value = JSON.parse(readFileSync(path));
    transform(value);
    update(path, JSON.stringify(value, null, 2) + "\n");
  };
  json("package.json", (pkg) => {
    pkg.name =
      config.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || config.appId.split(".").pop();
    pkg.version = config.version;
    pkg.homepage = config.websiteUrl;
    pkg.desktopName = config.appId + ".desktop";
  });
  if (existsSync("package-lock.json"))
    json("package-lock.json", (lock) => {
      const pkg = JSON.parse(
        pending.get("package.json") || readFileSync("package.json"),
      );
      lock.name = pkg.name;
      lock.version = config.version;
      lock.packages[""].name = pkg.name;
      lock.packages[""].version = config.version;
    });
  json("capacitor.config.json", (cap) => {
    if (cap.server)
      throw new Error("Remove dev server config before metadata sync.");
    cap.appId = config.appId;
    cap.appName = config.name;
    cap.webDir = "dist/native";
  });
  if (existsSync("android/app/build.gradle")) {
    let gradle = readFileSync("android/app/build.gradle", "utf8");
    if (!gradle.includes('applicationId "' + config.appId + '"'))
      throw new Error(
        "Android identity differs. Complete the reviewed migration first.",
      );
    gradle = gradle
      .replace(/versionCode \d+/, `versionCode ${config.androidVersionCode}`)
      .replace(/versionName "[^"]+"/, `versionName "${config.version}"`);
    update("android/app/build.gradle", gradle);
    const path = "android/app/src/main/res/values/strings.xml";
    update(
      path,
      readFileSync(path, "utf8").replace(
        /(<string name="(?:app_name|title_activity_main)">)[^<]*(<\/string>)/g,
        (_match, prefix, suffix) => prefix + xml(config.name) + suffix,
      ),
    );
  }
  if (existsSync("android/app/src/main/res/values")) {
    const path = "android/app/src/main/res/values/colors.xml";
    let text = existsSync(path)
      ? readFileSync(path, "utf8")
      : '<?xml version="1.0" encoding="utf-8"?>\n<!-- Managed branding colors; other native resources remain review-owned. -->\n<resources>\n</resources>\n';
    for (const name of ["colorPrimary", "colorPrimaryDark", "colorAccent"]) {
      const pattern = new RegExp(`(<color name="${name}">)[^<]*(<\\/color>)`);
      text = pattern.test(text)
        ? text.replace(
            pattern,
            (_match, prefix, suffix) => prefix + config.theme.primary + suffix,
          )
        : text.replace(
            "</resources>",
            `    <color name="${name}">${config.theme.primary}</color>\n</resources>`,
          );
    }
    update(path, text);
    const background =
      "android/app/src/main/res/values/ic_launcher_background.xml";
    if (existsSync(background))
      update(
        background,
        readFileSync(background, "utf8").replace(
          /(<color name="ic_launcher_background">)[^<]*(<\/color>)/,
          (_match, prefix, suffix) => prefix + config.theme.primary + suffix,
        ),
      );
  }
  if (existsSync("ios/App/App.xcodeproj/project.pbxproj")) {
    const path = "ios/App/App.xcodeproj/project.pbxproj";
    let text = readFileSync(path, "utf8");
    if (!text.includes("PRODUCT_BUNDLE_IDENTIFIER = " + config.appId + ";"))
      throw new Error(
        "iOS identity differs. Complete the reviewed migration first.",
      );
    text = text
      .replace(
        /MARKETING_VERSION = [^;]+;/g,
        `MARKETING_VERSION = ${config.version};`,
      )
      .replace(
        /CURRENT_PROJECT_VERSION = [^;]+;/g,
        `CURRENT_PROJECT_VERSION = ${config.iosBuildNumber};`,
      );
    update(path, text);
    const plist = "ios/App/App/Info.plist";
    update(
      plist,
      readFileSync(plist, "utf8").replace(
        /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
        (_match, prefix, suffix) => prefix + xml(config.name) + suffix,
      ),
    );
  }
  const branding =
    "/* Generated by config:sync; edit universal-app.config.json. */\n:root {\n  --brand-primary: " +
    config.theme.primary +
    ";\n  --brand-background: " +
    config.theme.background +
    ";\n  --brand-dark-primary: " +
    (config.theme.darkPrimary || "#b4adff") +
    ";\n  --brand-dark-background: " +
    (config.theme.darkBackground || "#151722") +
    ";\n}\n";
  const path = "src/styles/branding.css";
  update(path, branding);
  const finalized = [];
  for (const [path, raw] of pending) {
    const text =
      path.endsWith(".json") && !path.endsWith("package-lock.json")
        ? await format(raw, { parser: "json" })
        : raw;
    if (text !== (existsSync(path) ? readFileSync(path, "utf8") : ""))
      finalized.push([path, text]);
  }
  if (!dryRun) for (const [path, text] of finalized) writeFileSync(path, text);
  return finalized.map(([path]) => path);
}
if (isMain(import.meta.url))
  cli(async () => {
    if (process.argv.includes("--help")) {
      console.log(
        "config:validate validates config/provenance; config:sync [--dry-run] patches documented managed fields only. Review git diff. IDs are immutable without a separate guided migration.",
      );
      return;
    }
    if (process.argv[2] === "validate") {
      loadConfig();
      console.log(
        "PASS: config/provenance schemas and stable native identity.",
      );
    } else
      console.log(
        (process.argv.includes("--dry-run") ? "Would update: " : "Updated: ") +
          ((
            await syncConfig({ dryRun: process.argv.includes("--dry-run") })
          ).join(", ") || "already synchronized"),
      );
  });
