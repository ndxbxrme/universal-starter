import { parseDocument } from "yaml";
import { spawnSync } from "node:child_process";
import { loadConfig } from "./config.mjs";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { cli } from "./lib.mjs";
cli(async () => {
  loadConfig();
  const tracked = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );
  if (tracked.status !== 0) throw new Error("Git file inventory unavailable");
  for (const file of new Set(tracked.stdout.split("\0").filter(Boolean))) {
    if (
      /\.(jks|keystore|p12|pfx|mobileprovision|key)$/.test(file) ||
      (/\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example"))
    )
      throw new Error(
        "Sensitive file type in commit inventory; remove from Git before proceeding.",
      );
    if (
      /\.(js|mjs|cjs|json|md|html|yml|yaml|xml|gradle|properties|txt)$/.test(
        file,
      )
    ) {
      const text = await readFile(file, "utf8");
      if (
        /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{36,}/.test(
          text,
        )
      )
        throw new Error(
          "Potential secret material detected; contents suppressed.",
        );
    }
  }
  const cap = JSON.parse(await readFile("capacitor.config.json"));
  if (cap.server) throw new Error("Production config contains server settings");
  for (const path of [
    "android/app/src/main/assets/capacitor.config.json",
    "ios/App/App/capacitor.config.json",
  ])
    if (existsSync(path) && JSON.parse(await readFile(path)).server)
      throw new Error(
        "Generated native config contains dev server settings; run cap:sync.",
      );
  for (const path of ["dist/native/index.html", "dist/web/index.html"])
    if (existsSync(path)) {
      const html = await readFile(path, "utf8");
      if (/unsafe-inline|ws:\/\/|\/@vite\//.test(html))
        throw new Error("Development policy found in production HTML");
    }
  const pkg = JSON.parse(await readFile("package.json"));
  for (const script of Object.values(pkg.scripts)) {
    const match = script.match(/node (scripts\/[^\s]+\.mjs)/);
    if (match && !existsSync(match[1]))
      throw new Error("Script implementation missing: " + match[1]);
  }
  const workflows = await readdir(".github/workflows");
  for (const file of workflows) {
    const text = await readFile(".github/workflows/" + file, "utf8");
    if (parseDocument(text, { uniqueKeys: true }).errors.length)
      throw new Error("Workflow YAML failed parsing: " + file);
    if (text.includes("pull_request_target"))
      throw new Error("Unsafe PR trigger");
    for (const use of text.matchAll(/uses:\s*([^\s#]+)/g)) {
      if (!/@[0-9a-f]{40}$/.test(use[1]))
        throw new Error("Action is not SHA pinned: " + use[1]);
    }
  }
  console.log(
    "PASS: repository script targets, production configs/CSP and pinned workflow actions. Run actionlint separately for workflow schema validation.",
  );
});
