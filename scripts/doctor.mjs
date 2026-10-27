import { readFileSync, existsSync } from "node:fs";
import { has, cli } from "./lib.mjs";
import { loadConfig } from "./config.mjs";
import { printStatus } from "./credentials/status.mjs";
cli(() => {
  loadConfig();
  console.log(
    `Node ${process.versions.node}: ${process.versions.node.startsWith("24.") ? "PASS" : "BLOCKED (use Node 24)"}`,
  );
  for (const [name, args] of [
    ["npm", ["--version"]],
    ["java", ["-version"]],
    ["adb", ["version"]],
    ["xcodebuild", ["-version"]],
    ["maestro", ["--version"]],
    ["gh", ["--version"]],
  ])
    console.log(
      `${name}: ${has(name, args) ? "PASS" : "BLOCKED — install/enable when targeting that platform; see docs/toolchain.md"}`,
    );
  console.log(
    `Android SDK API 36: ${process.env.ANDROID_HOME && existsSync(process.env.ANDROID_HOME + "/platforms/android-36") ? "PASS" : "BLOCKED — set ANDROID_HOME and install platforms;android-36"}`,
  );
  console.log(
    `KVM: ${existsSync("/dev/kvm") ? "PASS (presence only; check emulator -accel-check)" : "BLOCKED on Linux — no /dev/kvm; physical device or accelerated CI needed"}`,
  );
  const cap = JSON.parse(readFileSync("capacitor.config.json"));
  if (cap.server)
    throw new Error(
      "FAIL: tracked Capacitor configuration contains development server settings",
    );
  printStatus();
  console.log(
    "PASS: doctor finished. Missing signing credentials are not an unsigned-development failure. No signature, device or store success is inferred.",
  );
});
