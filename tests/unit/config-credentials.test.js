import { it, expect, vi, afterEach } from "vitest";
import {
  readFileSync,
  writeFileSync,
  mkdtempSync,
  statSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateConfig, syncConfig } from "../../scripts/config.mjs";
import { validateReleaseConfig } from "../../scripts/release.mjs";
import {
  validateAndroid,
  saveReferences,
  externalFile,
  validateIos,
  validateWindows,
} from "../../scripts/credentials/lib.mjs";
import { githubPlan } from "../../scripts/credentials/github.mjs";
const config = JSON.parse(readFileSync("universal-app.config.json"));
const provenance = JSON.parse(readFileSync(".universal-app.json"));
const temporary = [];
afterEach(() => {
  vi.unstubAllEnvs();
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true });
});
function temp() {
  const path = mkdtempSync(join(tmpdir(), "universal-validation-"));
  temporary.push(path);
  return path;
}
it("validates schemas and rejects secret/identity/channel mistakes without logging values", () => {
  expect(validateConfig(config, provenance)).toBe(config);
  for (const value of [
    { ...config, secret: "SENSITIVE_TEST_MARKER" },
    { ...config, channel: "public" },
    { ...config, appId: "com.client.changed" },
    { ...config, androidVersionCode: 0 },
    { ...config, supportUrl: "https://user:password@example.com" },
  ]) {
    let error;
    try {
      validateConfig(value, provenance);
    } catch (value) {
      error = value;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error.message).not.toContain("SENSITIVE_TEST_MARKER");
  }
});
it("dry-run metadata sync leaves managed files intact", async () => {
  const files = [
    "package.json",
    "package-lock.json",
    "capacitor.config.json",
    "android/app/build.gradle",
    "ios/App/App.xcodeproj/project.pbxproj",
  ];
  const before = files.map((file) => readFileSync(file, "utf8"));
  await syncConfig({ dryRun: true });
  expect(files.map((file) => readFileSync(file, "utf8"))).toEqual(before);
});
it("release guard rejects template identities and supports reviewed configuration", () => {
  expect(() => validateReleaseConfig(config)).toThrow("placeholder");
  expect(() =>
    validateReleaseConfig({
      ...config,
      appId: "com.client.product",
      supportUrl: "https://client.test/support",
      websiteUrl: "https://client.test",
    }),
  ).not.toThrow();
});
it("validates Android through environment-only passwords and public certificate parsing", () => {
  const dir = temp(),
    file = join(dir, "upload.jks");
  writeFileSync(file, "TEST PLACEHOLDER, NOT A KEY");
  const env = {
    ANDROID_KEYSTORE_PATH: file,
    ANDROID_KEY_ALIAS: "upload",
    ANDROID_STORE_PASSWORD: "SENSITIVE_TEST_MARKER",
    ANDROID_KEY_PASSWORD: "OTHER_SENSITIVE_MARKER",
  };
  const runner = vi.fn(() => ({ status: 0, stdout: "public certificate" }));
  const result = validateAndroid(env, {
    runner,
    certificateFactory: () => ({
      validFrom: new Date(Date.now() - 10000).toISOString(),
      validTo: new Date(Date.now() + 86400000).toISOString(),
      fingerprint256: "AA:BB",
      publicKey: {
        asymmetricKeyType: "rsa",
        asymmetricKeyDetails: { modulusLength: 2048 },
      },
    }),
  });
  expect(result.fingerprint).toBe("AA:BB");
  const [, args, options] = runner.mock.calls[0];
  expect(args).toContain("-storepass:env");
  expect(args.join(" ")).not.toContain("SENSITIVE_TEST_MARKER");
  expect(options.env.ANDROID_STORE_PASSWORD).toBe("SENSITIVE_TEST_MARKER");
  expect(() =>
    validateAndroid(env, {
      runner: () => ({
        status: 1,
        stdout: "SENSITIVE_TEST_MARKER",
        stderr: "SENSITIVE_TEST_MARKER",
      }),
    }),
  ).toThrow("Sensitive tool output is suppressed");
});
it("rejects internal credential storage and saves only non-secret references", () => {
  const dir = temp(),
    file = join(dir, "upload.jks");
  writeFileSync(file, "NOT A KEY");
  expect(() => externalFile(file, dir)).toThrow("outside");
  const ref = join(dir, "references.json");
  saveReferences({
    UNIVERSAL_CREDENTIALS_FILE: ref,
    ANDROID_KEYSTORE_PATH: file,
    ANDROID_KEY_ALIAS: "upload",
    ANDROID_STORE_PASSWORD: "SENSITIVE_TEST_MARKER",
    CSC_KEY_PASSWORD: "OTHER_SENSITIVE_MARKER",
  });
  const text = readFileSync(ref, "utf8");
  expect(text).toContain("ANDROID_KEYSTORE_PATH");
  expect(text).not.toContain("SENSITIVE_MARKER");
  expect(text).not.toContain("SENSITIVE_TEST_MARKER");
  if (process.platform !== "win32")
    expect(statSync(ref).mode & 0o777).toBe(0o600);
});
it("GitHub plan is redacted, scoped and rejects key-file upload names", () => {
  vi.stubEnv("ANDROID_STORE_PASSWORD", "SENSITIVE_TEST_MARKER");
  const plan = githubPlan("client/project", "beta", ["ANDROID_STORE_PASSWORD"]);
  expect(JSON.stringify(plan)).not.toContain("SENSITIVE_TEST_MARKER");
  expect(plan.secrets[0].name).toBe("ANDROID_STORE_PASSWORD");
  expect(() => githubPlan("client/project", "unprotected")).toThrow();
  expect(() =>
    githubPlan("client/project", "production", ["PRIVATE_KEY"]),
  ).toThrow();
});
it("Apple/Windows credential checks report unsupported hosts honestly", () => {
  expect(() => validateIos({}, "linux")).toThrow("macOS");
  expect(() => validateWindows({}, "linux")).toThrow("Windows");
});

it("stages only matching current desktop artifacts and validates hashes", async () => {
  const { desktopArtifactMatches, verifyChecksums } =
    await import("../../scripts/distribution.mjs");
  const options = { os: "linux", arch: "x64", channel: "production" };
  expect(
    desktopArtifactMatches(
      `${config.name}-${config.version}-linux-x86_64-production.AppImage`,
      config,
      options,
    ),
  ).toBe(true);
  expect(
    desktopArtifactMatches(
      `${config.name}-9.9.9-linux-x86_64-production.AppImage`,
      config,
      options,
    ),
  ).toBe(false);
  expect(
    desktopArtifactMatches(
      `${config.name}-${config.version}-linux-x86_64-dev.AppImage`,
      config,
      options,
    ),
  ).toBe(false);
  const dir = temp();
  writeFileSync(join(dir, "app.zip"), "test");
  writeFileSync(join(dir, "SHA256SUMS"), "0".repeat(64) + "  app.zip\n");
  expect(() => verifyChecksums(dir)).toThrow("mismatch");
});
