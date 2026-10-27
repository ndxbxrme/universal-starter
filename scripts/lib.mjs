import { pathToFileURL } from "node:url";
import { spawnSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
export function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32" && /^(npm|npx)$|\.bat$/.test(command),
    ...options,
  });
  if (result.error)
    throw new Error(
      `Cannot run ${command}. Install prerequisites and check PATH; see docs/toolchain.md.`,
    );
  if (result.status !== 0)
    throw new Error(
      `${command} failed (exit ${result.status}). See output above.`,
    );
}
export function has(command, args = ["--version"]) {
  return (
    spawnSync(command, args, {
      stdio: "ignore",
      shell: process.platform === "win32" && /^(npm|npx)$|\.bat$/.test(command),
    }).status === 0
  );
}
export function requireTool(command, args) {
  if (!has(command, args))
    throw new Error(
      `BLOCKED: ${command} unavailable. Install prerequisites and add it to PATH. See docs/toolchain.md.`,
    );
}
export function requireMac() {
  if (process.platform !== "darwin")
    throw new Error(
      "BLOCKED: iOS/macOS requires macOS and Xcode 26+. See docs/ios.md.",
    );
  requireTool("xcodebuild", ["-version"]);
  if (!compatibleXcode())
    throw new Error(
      "BLOCKED: Capacitor iOS requires Xcode 26+. See docs/ios.md.",
    );
}
export function toolVersion(command, args, pattern) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32" && /^(npm|npx)$/.test(command),
  });
  return result.status === 0
    ? (result.stdout + result.stderr).match(pattern)?.[1] || null
    : null;
}
export function compatibleJava() {
  return Boolean(
    toolVersion("java", ["-version"], /version "([0-9.]+)"/)?.startsWith(
      "21.",
    ) && has("javac", ["-version"]),
  );
}
export function compatibleXcode() {
  return (
    Number(
      toolVersion("xcodebuild", ["-version"], /Xcode ([0-9.]+)/)?.split(".")[0],
    ) >= 26
  );
}
export function requireAndroid() {
  if (!compatibleJava())
    throw new Error(
      "BLOCKED: use the tested JDK 21 (JAVA_HOME and PATH, including javac). See docs/android.md.",
    );
  requireTool("java", ["-version"]);
  if (!process.env.ANDROID_HOME || !existsSync(process.env.ANDROID_HOME))
    throw new Error(
      "BLOCKED: set ANDROID_HOME to your Android SDK (API 36). See docs/android.md.",
    );
}
export function start(command, args, options = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32" && /^(npm|npx)$|\.bat$/.test(command),
    ...options,
  });
}
export function cli(action) {
  Promise.resolve()
    .then(action)
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
export function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
}

export function isMain(url) {
  return Boolean(
    process.argv[1] && url === pathToFileURL(process.argv[1]).href,
  );
}

export function assertReleaseChannel(channel) {
  if (!["beta", "production"].includes(channel))
    throw new Error(
      "Release channel must be beta or production; set APP_CHANNEL explicitly.",
    );
}
