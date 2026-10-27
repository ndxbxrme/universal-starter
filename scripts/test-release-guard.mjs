import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { requireAndroid, cli } from "./lib.mjs";
cli(() => {
  requireAndroid();
  const path = "android/app/src/main/assets/capacitor.config.json",
    original = readFileSync(path);
  try {
    const config = JSON.parse(original);
    config.server = { url: "http://development.invalid:5173", cleartext: true };
    writeFileSync(path, JSON.stringify(config));
    const result = spawnSync(
      process.platform === "win32" ? "gradlew.bat" : "./gradlew",
      [":app:verifyBundledRelease", "--no-daemon"],
      { cwd: "android", encoding: "utf8", shell: process.platform === "win32" },
    );
    if (
      result.status === 0 ||
      !(result.stdout + result.stderr).includes(
        "Release blocked: development server configuration",
      )
    )
      throw new Error("Release guard was not proven; check Java/SDK/Gradle.");
    console.log(
      "PASS: real Gradle release guard rejected injected dev config. Original configuration restored.",
    );
  } finally {
    writeFileSync(path, original);
  }
});
