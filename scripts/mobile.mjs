import { assertReleaseChannel } from "./lib.mjs";
import { applyReferences } from "./credentials/lib.mjs";
import {
  readFileSync,
  existsSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  run,
  requireAndroid,
  requireMac,
  requireTool,
  cli,
  option,
} from "./lib.mjs";
const config = JSON.parse(readFileSync("universal-app.config.json"));
const action = process.argv[2];
function adb(args) {
  run("adb", [...(option("device") ? ["-s", option("device")] : []), ...args]);
}
function sync(target) {
  run("npm", ["run", "build"]);
  run("npx", ["cap", "sync", ...(target ? [target] : [])]);
}
function safeNative() {
  const cap = JSON.parse(readFileSync("capacitor.config.json"));
  if (cap.server)
    throw new Error(
      "Release safeguard: remove server from capacitor.config.json.",
    );
  const native = "android/app/src/main/assets/capacitor.config.json";
  if (existsSync(native) && JSON.parse(readFileSync(native)).server)
    throw new Error(
      "Release safeguard: native server URL remains; run cap:sync.",
    );
}
export function validateAddress(address) {
  if (
    !/^[a-zA-Z0-9.-]+:\d{1,5}$/.test(address) ||
    Number(address.split(":")[1]) > 65535 ||
    Number(address.split(":")[1]) < 1
  )
    throw new Error(
      "Enter host:port from the phone’s Wireless debugging settings.",
    );
  return address;
}
cli(async () => {
  applyReferences();
  if (process.argv.includes("--help")) {
    console.log(
      "Mobile commands: sync [android|ios], build-android [--release], pair, install/logs/devices [--device SERIAL], live [--host LAN_IP --device SERIAL], build-ios [--device SIMULATOR_UDID], dev-ios, open-android/open-ios. See docs/android-wireless.md and docs/ios.md.",
    );
    return;
  }
  const target = process.argv[3];
  if (action === "sync") {
    sync(target);
    return;
  }
  if (action === "pair") {
    requireTool("adb", ["version"]);
    const prompt = createInterface({ input: stdin, output: stdout });
    try {
      const pairing = validateAddress(
        await prompt.question("Phone pairing address (host:PAIRING_PORT): "),
      );
      run("adb", ["pair", pairing]);
      const connection = validateAddress(
        await prompt.question("Phone debugging address (host:DEBUG_PORT): "),
      );
      run("adb", ["connect", connection]);
      run("adb", ["devices", "-l"]);
    } finally {
      prompt.close();
    }
    return;
  }
  if (["devices", "install", "logs"].includes(action)) {
    requireTool("adb", ["version"]);
    if (action === "devices") adb(["devices", "-l"]);
    if (action === "install") {
      const apk = "android/app/build/outputs/apk/debug/app-debug.apk";
      if (!existsSync(apk))
        throw new Error("Build the bundled APK first: npm run build:android");
      adb(["install", "-r", apk]);
    }
    if (action === "logs") {
      const { spawnSync } = await import("node:child_process");
      const result = spawnSync(
        "adb",
        [
          ...(option("device") ? ["-s", option("device")] : []),
          "shell",
          "pidof",
          config.appId,
        ],
        { encoding: "utf8" },
      );
      const pid = result.stdout?.trim();
      if (!/^\d+$/.test(pid || ""))
        throw new Error(
          "App is not running. Launch it on the selected device, then retry logs.",
        );
      adb(["logcat", "--pid=" + pid]);
    }
    return;
  }
  if (action === "open-android") {
    run("npx", ["cap", "open", "android"]);
    return;
  }
  if (action === "open-ios") {
    requireMac();
    run("npx", ["cap", "open", "ios"]);
    return;
  }
  if (action === "build-android") {
    requireAndroid();
    if (!config.targets.includes("android"))
      throw new Error("Android target is disabled in canonical config.");
    const release = process.argv.includes("--release");
    if (release) {
      process.env.APP_CHANNEL ||= "production";
      assertReleaseChannel(process.env.APP_CHANNEL);
    }
    sync("android");
    safeNative();
    if (release)
      console.log(
        process.env.ANDROID_KEYSTORE_PATH
          ? "Release signing configured; verify the resulting signature before distribution."
          : "No signing credentials: generating an UNSIGNED release AAB, not ready for Play.",
      );
    run(
      process.platform === "win32" ? "gradlew.bat" : "./gradlew",
      [release ? ":app:bundleRelease" : ":app:assembleDebug", "--no-daemon"],
      { cwd: "android" },
    );
    return;
  }
  if (action === "live") {
    requireAndroid();
    requireTool("adb", ["version"]);
    const host = option("host");
    if (!host || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === "0.0.0.0")
      throw new Error(
        "Supply your private LAN interface: npm run dev:android -- --host LAN_IP --device ADB_SERIAL. Never expose Vite or ADB on a public network.",
      );
    const { createServer } = await import("vite");
    const server = await createServer({
      server: { host, port: 5173, strictPort: true },
    });
    const path = "android/app/src/main/assets/capacitor.config.json";
    const manifest = "android/app/src/debug/AndroidManifest.xml";
    const previous = existsSync(manifest) ? readFileSync(manifest) : null;
    const restore = async () => {
      if (existsSync(path)) {
        const native = JSON.parse(readFileSync(path));
        delete native.server;
        writeFileSync(path, JSON.stringify(native, null, 2) + "\n");
      }
      if (previous) writeFileSync(manifest, previous);
      else rmSync(manifest, { force: true });
      await server.close();
    };
    const stop = async () => {
      await restore();
      process.exit(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    try {
      sync("android");
      await server.listen();
      const native = JSON.parse(readFileSync(path));
      native.server = { url: `http://${host}:5173`, cleartext: true };
      writeFileSync(path, JSON.stringify(native, null, 2) + "\n");
      mkdirSync("android/app/src/debug", { recursive: true });
      writeFileSync(
        manifest,
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"><application android:usesCleartextTraffic="true" tools:replace="android:usesCleartextTraffic" /></manifest>',
      );
      run(
        process.platform === "win32" ? "gradlew.bat" : "./gradlew",
        [":app:assembleDebug", "--no-daemon"],
        { cwd: "android" },
      );
      adb([
        "install",
        "-r",
        "android/app/build/outputs/apk/debug/app-debug.apk",
      ]);
      adb(["shell", "am", "start", "-n", `${config.appId}/.MainActivity`]);
      console.log(
        "Live reload running; Ctrl+C restores bundled configuration. A plugin change needs a rebuild.",
      );
      await new Promise(() => {});
    } finally {
      await restore();
    }
    return;
  }
  if (["build-ios", "release-ios", "dev-ios"].includes(action)) {
    requireMac();
    if (!config.targets.includes("ios"))
      throw new Error("iOS target is disabled in canonical config.");
    if (action === "release-ios") {
      process.env.APP_CHANNEL ||= "production";
      assertReleaseChannel(process.env.APP_CHANNEL);
    }
    sync("ios");
    safeNative();
    if (action === "dev-ios") {
      run("npx", ["cap", "open", "ios"]);
      return;
    }
    const args = [
      "-project",
      "ios/App/App.xcodeproj",
      "-scheme",
      "App",
      "-configuration",
      action === "release-ios" ? "Release" : "Debug",
    ];
    if (action === "build-ios") {
      run("xcodebuild", [
        ...args,
        "-sdk",
        "iphonesimulator",
        "-destination",
        option("device")
          ? `id=${option("device")}`
          : "generic/platform=iOS Simulator",
        "-derivedDataPath",
        "artifacts/ios",
        "CODE_SIGNING_ALLOWED=NO",
        "build",
      ]);
      return;
    }
    if (!process.env.APPLE_TEAM_ID || !process.env.IOS_EXPORT_OPTIONS)
      throw new Error(
        "Signed iOS export requires APPLE_TEAM_ID and IOS_EXPORT_OPTIONS pointing to your reviewed ExportOptions.plist plus keychain signing identity/profile. See docs/credentials.md.",
      );
    run("xcodebuild", [
      ...args,
      "-destination",
      "generic/platform=iOS",
      "-archivePath",
      "artifacts/App.xcarchive",
      `DEVELOPMENT_TEAM=${process.env.APPLE_TEAM_ID}`,
      "archive",
    ]);
    run("xcodebuild", [
      "-exportArchive",
      "-archivePath",
      "artifacts/App.xcarchive",
      "-exportPath",
      "artifacts/ios-release",
      "-exportOptionsPlist",
      process.env.IOS_EXPORT_OPTIONS,
    ]);
    return;
  }
  throw new Error("Unknown mobile action. Use --help.");
});
