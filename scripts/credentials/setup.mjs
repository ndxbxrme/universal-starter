import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { cli } from "../lib.mjs";
import {
  applyReferences,
  saveReferences,
  validateAndroid,
  validateIos,
  validateWindows,
  validateMacos,
} from "./lib.mjs";
async function ask(label, secret = false) {
  if (!stdin.isTTY)
    throw new Error(
      "Missing environment input. Use --non-interactive with documented environment variables.",
    );
  if (!secret) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      return await rl.question(label + ": ");
    } finally {
      rl.close();
    }
  }
  const muted = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const rl = createInterface({ input: stdin, output: muted, terminal: true });
  stdout.write(label + ": ");
  try {
    return await rl.question("");
  } finally {
    rl.close();
    stdout.write("\n");
  }
}
cli(async () => {
  const platform = process.argv[2];
  if (process.argv.includes("--help")) {
    console.log(
      "credentials:setup:" +
        platform +
        " [--non-interactive] [--dry-run] [--save-references]. Validates client-owned external files/OS certificate stores. Passwords are read only from environment or hidden TTY prompts. --save-references stores only non-secret paths/identifiers outside the repo (mode 600). Default is validation-only. No key generation/import/rotation. See docs/credentials.md.",
    );
    return;
  }
  applyReferences();
  const inputs = {
    android: [
      "ANDROID_KEYSTORE_PATH",
      "ANDROID_KEY_ALIAS",
      "ANDROID_STORE_PASSWORD",
      "ANDROID_KEY_PASSWORD",
    ],
    ios: ["APPLE_TEAM_ID"],
    windows: ["WINDOWS_CERTIFICATE_SHA1"],
    macos: ["CSC_NAME"],
  }[platform];
  if (!inputs) throw new Error("Choose android, ios, windows or macos.");
  if (
    (platform === "ios" || platform === "macos") &&
    process.platform !== "darwin"
  )
    throw new Error(
      "BLOCKED: Apple keychain validation requires macOS. See docs/credentials.md.",
    );
  if (platform === "windows" && process.platform !== "win32")
    throw new Error(
      "BLOCKED: Windows certificate-store validation requires Windows. See docs/credentials.md.",
    );
  for (const name of inputs)
    if (!process.env[name]) {
      if (process.argv.includes("--non-interactive"))
        throw new Error("Missing " + name + ". See docs/credentials.md.");
      process.env[name] = await ask(name, /PASSWORD/.test(name));
    }
  if (process.argv.includes("--dry-run")) {
    console.log(
      "Dry run: inputs present; no cryptographic operations or files written. Use validation-only without --dry-run to validate tooling/certificates.",
    );
    return;
  }
  const result = {
    android: validateAndroid,
    ios: validateIos,
    windows: validateWindows,
    macos: validateMacos,
  }[platform]();
  if (process.argv.includes("--save-references")) {
    saveReferences();
    console.log(
      "Non-secret references saved outside the repository with restrictive permissions. Passwords were not persisted.",
    );
  }
  console.log("PASS: credential input validation.");
  if (result.fingerprint)
    console.log(
      "Public certificate SHA-256:",
      result.fingerprint,
      "expires:",
      result.expires,
    );
  console.log(result.note);
});
