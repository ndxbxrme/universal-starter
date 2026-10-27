import { readFileSync, mkdirSync } from "node:fs";
import {
  run,
  requireAndroid,
  requireMac,
  requireTool,
  cli,
  option,
  has,
} from "./lib.mjs";
process.env.MAESTRO_CLI_NO_ANALYTICS = "1";
process.env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = "true";
const config = JSON.parse(readFileSync("universal-app.config.json"));
function test(target) {
  if (target === "android") {
    requireAndroid();
    requireTool("adb", ["version"]);
    requireTool("maestro", ["--version"]);
    if (
      !has("adb", [
        ...(option("device") ? ["-s", option("device")] : []),
        "get-state",
      ])
    )
      throw new Error(
        "BLOCKED: no unique authorized Android device. Boot an emulator or connect a phone, then pass --device SERIAL. See docs/android.md.",
      );
    run("npm", ["run", "build:android"]);
    run(
      process.platform === "win32" ? "gradlew.bat" : "./gradlew",
      [":app:connectedDebugAndroidTest", "--no-daemon"],
      {
        cwd: "android",
        env: {
          ...process.env,
          ...(option("device") ? { ANDROID_SERIAL: option("device") } : {}),
        },
      },
    );
    run("adb", [
      ...(option("device") ? ["-s", option("device")] : []),
      "install",
      "-r",
      "android/app/build/outputs/apk/debug/app-debug.apk",
    ]);
  } else {
    requireMac();
    requireTool("maestro", ["--version"]);
    const device = option("device") || "booted";
    run("npm", ["run", "build:ios"]);
    run("xcrun", ["simctl", "bootstatus", device, "-b"]);
    run("xcrun", [
      "simctl",
      "install",
      device,
      "artifacts/ios/Build/Products/Debug-iphonesimulator/App.app",
    ]);
  }
  mkdirSync(`artifacts/${target}-smoke`, { recursive: true });
  try {
    run("maestro", [
      ...(option("device") ? ["--device", option("device")] : []),
      "test",
      "-e",
      `APP_ID=${config.appId}`,
      "--test-output-dir",
      `artifacts/${target}-smoke`,
      "tests/mobile/smoke.yaml",
    ]);
  } finally {
    if (target === "android") run("adb", ["logcat", "-d", "-t", "500"]);
    else
      run("xcrun", [
        "simctl",
        "io",
        option("device") || "booted",
        "screenshot",
        "artifacts/ios-smoke/simulator.png",
      ]);
  }
}
cli(() => {
  const target = process.argv[2];
  if (target === "all") {
    console.log(
      `Available host targets: android${process.platform === "darwin" ? ", ios" : "; iOS BLOCKED: requires macOS"}`,
    );
    test("android");
    if (process.platform === "darwin") test("ios");
  } else test(target);
});
