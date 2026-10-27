import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { has, isMain } from "../lib.mjs";
export function readiness(env = process.env, host = process.platform) {
  const desktop =
    host === "darwin" ? "macos" : host === "win32" ? "windows" : "linux";
  const development = {
    web: Number(process.versions.node.split(".")[0]) === 24,
    android:
      has("java", ["-version"]) &&
      Boolean(env.ANDROID_HOME && existsSync(env.ANDROID_HOME)) &&
      has("adb", ["version"]),
    ios: host === "darwin" && has("xcodebuild", ["-version"]),
    windows: desktop === "windows",
    macos: desktop === "macos",
    linux: desktop === "linux",
  };
  const result = Object.fromEntries(
    Object.entries(development).map(([platform, ready]) => [
      platform,
      {
        development: {
          status: ready ? "PASS" : "BLOCKED",
          next: ready
            ? "Run the documented build and smoke tests."
            : "Install target SDK/host prerequisites; see docs/toolchain.md.",
        },
        localSigning: {
          status: ["web", "linux"].includes(platform) ? "PASS" : "NEEDS_SETUP",
          next: ["web", "linux"].includes(platform)
            ? "No universal signing requirement; validate distribution checksums."
            : "Validate client-supplied references with credentials:setup:" +
              platform +
              ", then build and verify a signed artifact. No signing success inferred from environment variables.",
        },
        ciSigning: {
          status: "NEEDS_SETUP",
          next: "Provision a protected client-signing runner and review beta/production settings; see credentials:github:plan. CI credentials have not been inspected.",
        },
        publication: {
          status: "BLOCKED",
          next: "Account ownership, listing, privacy declarations and distribution approval require manual verification.",
        },
      },
    ]),
  );
  if (process.argv.includes("--verify-artifacts"))
    for (const target of ["android", "ios", "windows", "macos"]) {
      if (
        target !== "android" &&
        !(target === "ios" || target === "macos"
          ? host === "darwin"
          : host === "win32")
      )
        continue;
      const checked = spawnSync(
        process.execPath,
        ["scripts/release.mjs", "verify-signature"],
        { env: { ...env, RELEASE_TARGET: target }, stdio: "ignore" },
      );
      if (checked.status === 0)
        result[target].localSigning = {
          status: "PASS",
          next: "Actual artifact signature verified; CI/store/device readiness remains separate.",
        };
    }
  result.macos.notarization = {
    status: "NEEDS_SETUP",
    next: "Signing and notarization are separate. Opt in with DESKTOP_NOTARIZE=1 and validate the notarized artifact on macOS.",
  };
  if (
    process.argv.includes("--verify-artifacts") &&
    host === "darwin" &&
    env.DESKTOP_NOTARIZE === "1" &&
    result.macos.localSigning.status === "PASS"
  )
    result.macos.notarization = {
      status: "PASS",
      next: "Actual signed artifact passed Gatekeeper assessment; publication remains separately controlled.",
    };
  return result;
}
export function printStatus() {
  const status = readiness();
  if (process.argv.includes("--json"))
    console.log(JSON.stringify(status, null, 2));
  else
    for (const [platform, stages] of Object.entries(status)) {
      console.log(platform);
      for (const [stage, value] of Object.entries(stages))
        console.log(`  ${stage}: ${value.status} — ${value.next}`);
    }
  return status;
}
if (isMain(import.meta.url)) {
  if (process.argv.includes("--help"))
    console.log(
      "credentials:status [--json] [--verify-artifacts] [--non-interactive]: redacted development, local signing, CI signing and publication readiness. Never prints environment values.",
    );
  else printStatus();
}
