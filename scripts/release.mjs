import { desktopArtifactMatches, verifyChecksums } from "./distribution.mjs";
import { basename } from "node:path";
import { loadConfig } from "./config.mjs";
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdtempSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { run, requireTool, cli, isMain } from "./lib.mjs";
const config = JSON.parse(readFileSync("universal-app.config.json"));
export function validateReleaseConfig(value) {
  if (
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value.version) ||
    !Number.isSafeInteger(value.androidVersionCode) ||
    value.androidVersionCode < 1 ||
    !Number.isSafeInteger(value.iosBuildNumber) ||
    value.iosBuildNumber < 1
  )
    throw new Error("Invalid version or native build numbers");
  if (
    value.appId.startsWith("dev.example.") ||
    new URL(value.supportUrl).hostname === "example.com" ||
    new URL(value.websiteUrl).hostname === "example.com"
  )
    throw new Error(
      "Replace placeholder app identity/support URLs before release; see docs/customisation.md.",
    );
}
function prepare() {
  loadConfig();
  const android = readFileSync("android/app/build.gradle", "utf8"),
    ios = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
  if (
    !android.includes(`applicationId "${config.appId}"`) ||
    !android.includes(`versionName "${config.version}"`) ||
    !android.includes(`versionCode ${config.androidVersionCode}`) ||
    !ios.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${config.appId};`) ||
    !ios.includes(`MARKETING_VERSION = ${config.version};`) ||
    !ios.includes(`CURRENT_PROJECT_VERSION = ${config.iosBuildNumber};`)
  )
    throw new Error(
      "Native metadata differs from canonical configuration; run config:sync and review the diff.",
    );
  validateReleaseConfig(config);
  const pkg = JSON.parse(readFileSync("package.json"));
  if (pkg.version !== config.version)
    throw new Error("Version mismatch; run config:sync.");
  if (!readFileSync("CHANGELOG.md", "utf8").includes("## " + config.version))
    throw new Error("Add the version entry to CHANGELOG.md.");
  const cap = JSON.parse(readFileSync("capacitor.config.json"));
  if (cap.server)
    throw new Error("Release blocked: development server configuration");
  const tag = process.env.GITHUB_REF_NAME;
  if (tag && tag !== "v" + config.version)
    throw new Error("Tag must match v" + config.version);
  const clean = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  });
  if (clean.status !== 0 || clean.stdout.trim())
    throw new Error(
      "Commit reviewed source changes before release preparation.",
    );
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/release-notes.md", readFileSync("CHANGELOG.md"));
  console.log(
    "PASS: release identity, version, changelog, clean source and server safeguards. Release notes generated in artifacts. No publication performed.",
  );
}
function files(root, extension) {
  if (!existsSync(root)) return [];
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.name.endsWith(extension)) found.push(path);
    else if (entry.isDirectory()) found.push(...files(path, extension));
  }
  return found;
}
function verifyJar(path) {
  const result = spawnSync("jarsigner", ["-verify", path], {
    encoding: "utf8",
  });
  if (
    result.status !== 0 ||
    !result.stdout.includes("jar verified.") ||
    result.stdout.includes("jar is unsigned")
  )
    throw new Error(
      "AAB signature verification failed or artifact is unsigned.",
    );
  console.log(
    "PASS: signed AAB cryptographic verification. Store account/upload readiness is separate.",
  );
}
if (isMain(import.meta.url))
  cli(() => {
    if (process.argv.includes("--help")) {
      console.log(
        "release:prepare validates reviewed identity/version/clean git and writes release notes. release prints protected dispatch instructions. CI actions require RELEASE_ENABLED=true, a matching version tag, provisioned client-signing runner and real credentials. No store submission is implemented; see docs/releases-and-updates.md.",
      );
      return;
    }
    const action = process.argv[2];
    const target = process.env.RELEASE_TARGET;
    if (action === "prepare") {
      prepare();
      return;
    }
    if (action === "entry") {
      prepare();
      console.log(
        "Create a reviewed v" +
          config.version +
          " tag, then dispatch beta.yml or release.yml on that tag after configuring protected environments. See docs/github-actions.md. This command does not push tags or publish.",
      );
      return;
    }
    if (action === "ci") {
      if (process.env.RELEASE_ENABLED !== "true")
        throw new Error(
          "Release disabled. Explicitly configure RELEASE_ENABLED=true in the protected environment after client handoff.",
        );
      if (!process.env.GITHUB_REF?.startsWith("refs/tags/v"))
        throw new Error("Only reviewed version-tag dispatches are allowed.");
      prepare();
      return;
    }
    if (action === "build-release") {
      if (process.env.RELEASE_ENABLED !== "true")
        throw new Error("Release disabled.");
      if (target === "android") {
        for (const name of [
          "ANDROID_KEYSTORE_PATH",
          "ANDROID_STORE_PASSWORD",
          "ANDROID_KEY_ALIAS",
          "ANDROID_KEY_PASSWORD",
        ])
          if (!process.env[name])
            throw new Error("Missing required signing input: " + name);
        run("npm", [
          "run",
          "credentials:setup:android",
          "--",
          "--non-interactive",
        ]);
        run("npm", ["run", "build:android:release"]);
      } else if (target === "ios") {
        run("npm", ["run", "credentials:setup:ios", "--", "--non-interactive"]);
        run("npm", ["run", "build:ios:release"]);
      } else if (["windows", "macos", "linux"].includes(target)) {
        if (target !== "linux") {
          process.env.DESKTOP_SIGN = "1";
          if (target === "macos") process.env.DESKTOP_NOTARIZE = "1";
          run("npm", [
            "run",
            "credentials:setup:" + target,
            "--",
            "--non-interactive",
          ]);
        }
        run("npm", ["run", "build:desktop"]);
      } else throw new Error("Unknown RELEASE_TARGET");
      return;
    }
    if (action === "verify-signature") {
      if (target === "android")
        verifyJar("android/app/build/outputs/bundle/release/app-release.aab");
      else if (target === "ios") {
        const ipa = files("artifacts/ios-release", ".ipa")[0];
        if (!ipa) throw new Error("No exported IPA");
        const dir = mkdtempSync(join(tmpdir(), "universal-ipa-"));
        run("ditto", ["-x", "-k", ipa, dir]);
        const app = files(join(dir, "Payload"), ".app")[0];
        if (!app) throw new Error("IPA has no app");
        run("codesign", ["--verify", "--deep", "--strict", app]);
        const result = spawnSync("codesign", ["-dv", "--verbose=4", app], {
          encoding: "utf8",
        });
        if (
          result.status !== 0 ||
          result.stderr.includes("Signature=adhoc") ||
          !result.stderr.includes("Authority=")
        )
          throw new Error("IPA lacks a certificate-backed signature.");
      } else if (target === "macos") {
        const app = files("artifacts/desktop", ".app")[0];
        if (!app) throw new Error("No packaged Mac app");
        run("codesign", ["--verify", "--deep", "--strict", app]);
        if (process.env.DESKTOP_NOTARIZE === "1")
          run("spctl", ["--assess", "--type", "execute", app]);
        else
          console.log(
            "Signature checked; notarization requires a separate approved notarization build and Gatekeeper assessment.",
          );
      } else if (target === "windows") {
        const file = files("artifacts/desktop", ".exe").find((file) =>
          desktopArtifactMatches(basename(file), config, {
            channel: process.env.APP_CHANNEL,
            os: "win32",
          }),
        );
        if (!file) throw new Error("No NSIS installer");
        run(
          "powershell.exe",
          [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            '$s=Get-AuthenticodeSignature -LiteralPath $env:RELEASE_VERIFY_FILE; $v=(Get-Item -LiteralPath $env:RELEASE_VERIFY_FILE).VersionInfo.ProductVersion; if ($s.Status -ne "Valid" -or !$v.StartsWith($env:RELEASE_VERIFY_VERSION) -or ($env:WINDOWS_CERTIFICATE_SHA1 -and $s.SignerCertificate.Thumbprint -ne $env:WINDOWS_CERTIFICATE_SHA1)) {exit 1}',
          ],
          {
            env: {
              ...process.env,
              RELEASE_VERIFY_FILE: file,
              RELEASE_VERIFY_VERSION: config.version,
            },
          },
        );
      } else if (target === "linux")
        console.log(
          "Linux has no universal signing requirement; distribution integrity is checked with staged SHA-256 checksums.",
        );
      else throw new Error("Unknown RELEASE_TARGET");
      return;
    }
    if (action === "draft") {
      if (process.env.RELEASE_ENABLED !== "true")
        throw new Error("Release disabled.");
      requireTool("gh");
      const tag = process.env.GITHUB_REF_NAME;
      if (tag !== "v" + config.version) throw new Error("Tag/version mismatch");
      const paths = [];
      function collect(root) {
        for (const entry of readdirSync(root, { withFileTypes: true })) {
          const file = join(root, entry.name);
          if (entry.isDirectory()) collect(file);
          else if (
            /\.(aab|ipa|exe|dmg|zip|AppImage|deb)$/.test(entry.name) ||
            entry.name === "SHA256SUMS"
          )
            paths.push(file);
        }
      }
      verifyChecksums("artifacts/release");
      collect("artifacts/release");
      if (!paths.length)
        throw new Error("No verified release artifacts downloaded");
      run("gh", [
        "release",
        "create",
        tag,
        "--draft",
        "--verify-tag",
        "--title",
        config.name + " " + config.version,
        "--notes-file",
        "CHANGELOG.md",
        ...paths,
      ]);
      return;
    }
    throw new Error("Unknown release action; use --help.");
  });
