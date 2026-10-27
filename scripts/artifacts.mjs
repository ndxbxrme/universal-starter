import { desktopArtifactMatches } from "./distribution.mjs";
import {
  readFile,
  readdir,
  mkdir,
  copyFile,
  writeFile,
  rm,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { run, cli } from "./lib.mjs";
cli(async () => {
  const config = JSON.parse(await readFile("universal-app.config.json"));
  const target = process.argv[2];
  if (!["android", "ios", "web", "desktop"].includes(target))
    throw new Error("Choose artifacts target: android, ios, web or desktop.");
  const channel = process.env.APP_CHANNEL || config.channel;
  const platform =
    target === "desktop"
      ? { win32: "windows", darwin: "macos", linux: "linux" }[process.platform]
      : target;
  const slug =
    config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || config.appId.split(".").pop();
  const name = `${slug}-${config.version}-${platform}-${["web", "android"].includes(target) ? "universal" : process.arch}-${channel}`;
  const dir = `artifacts/staging/${target}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  let files = [];
  if (target === "android")
    files = [
      process.env.RELEASE_BUILD === "1"
        ? "android/app/build/outputs/bundle/release/app-release.aab"
        : "android/app/build/outputs/apk/debug/app-debug.apk",
    ];
  else if (target === "ios") {
    const app =
      process.env.RELEASE_BUILD === "1"
        ? "artifacts/ios-release"
        : "artifacts/ios/Build/Products/Debug-iphonesimulator/App.app";
    if (process.env.RELEASE_BUILD === "1")
      files = (await readdir(app))
        .filter((f) => f.endsWith(".ipa"))
        .map((f) => join(app, f));
    else {
      if (!existsSync(app))
        throw new Error("No simulator app to archive. Run build:ios on macOS.");
      run("ditto", [
        "-c",
        "-k",
        "--sequesterRsrc",
        "--keepParent",
        app,
        `${dir}/${name}-simulator.zip`,
      ]);
    }
  } else if (target === "web") {
    if (!existsSync("dist/web")) throw new Error("Run build:web first.");
    run("tar", ["-czf", `${dir}/${name}.tar.gz`, "-C", "dist/web", "."]);
  } else
    files = (await readdir("artifacts/desktop"))
      .filter((f) => desktopArtifactMatches(f, config, { channel }))
      .map((f) => join("artifacts/desktop", f));
  for (const file of files) {
    if (!existsSync(file)) throw new Error(`Missing build artifact: ${file}`);
    const ext = basename(file).split(".").pop();
    await copyFile(file, `${dir}/${name}.${ext}`);
  }
  const outputs = (await readdir(dir)).filter(
    (f) => f !== "SHA256SUMS" && f !== "RELEASE-NOTES.md",
  );
  if (!outputs.length) throw new Error("No distribution artifacts generated");
  const sums = [];
  for (const file of outputs) {
    const data = await readFile(join(dir, file));
    sums.push(`${createHash("sha256").update(data).digest("hex")}  ${file}`);
  }
  await writeFile(join(dir, "SHA256SUMS"), sums.join("\n") + "\n");
  await copyFile("CHANGELOG.md", join(dir, "RELEASE-NOTES.md"));
  console.log("Staged artifacts + SHA-256 checksums:", dir);
});
