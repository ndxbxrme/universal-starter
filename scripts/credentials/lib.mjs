import {
  existsSync,
  readFileSync,
  realpathSync,
  lstatSync,
  statSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { resolve, relative, isAbsolute, dirname, join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { X509Certificate, createHash } from "node:crypto";
export const referenceNames = [
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEY_ALIAS",
  "APPLE_TEAM_ID",
  "IOS_PROVISIONING_PROFILE",
  "IOS_EXPORT_OPTIONS",
  "CSC_LINK",
  "CSC_NAME",
  "WINDOWS_CERTIFICATE_SHA1",
  "APPLE_KEYCHAIN_PROFILE",
  "APPLE_KEYCHAIN",
];
export function externalFile(file, root = process.cwd()) {
  if (
    !file ||
    !isAbsolute(file) ||
    !existsSync(file) ||
    !statSync(file).isFile()
  )
    throw new Error(
      "Supply an existing absolute external credential-file reference.",
    );
  const lexical = relative(realpathSync(root), resolve(file));
  if (!lexical.startsWith("..") && !isAbsolute(lexical))
    throw new Error("Keep credential references outside the project.");
  const path = realpathSync(file),
    inside = relative(realpathSync(root), path);
  if (!inside.startsWith("..") && !isAbsolute(inside))
    throw new Error(
      "Keep client signing files outside the project source directory.",
    );
  return path;
}
export function referencePath(env = process.env) {
  const id = JSON.parse(readFileSync(".universal-app.json")).projectId;
  const path = resolve(
    env.UNIVERSAL_CREDENTIALS_FILE ||
      join(
        homedir(),
        ".config",
        "universal-app",
        "credentials",
        id +
          "-" +
          createHash("sha256")
            .update(JSON.parse(readFileSync("universal-app.config.json")).appId)
            .digest("hex")
            .slice(0, 12) +
          ".json",
      ),
  );
  if (existsSync(path) && lstatSync(path).isSymbolicLink())
    throw new Error("Credential metadata must not be a symbolic link.");
  const inside = relative(process.cwd(), path);
  if (!inside.startsWith("..") && !isAbsolute(inside))
    throw new Error(
      "Credential reference metadata must be outside the repository.",
    );
  return path;
}
export function loadReferences(env = process.env) {
  const path = referencePath(env);
  if (!existsSync(path)) return {};
  let data;
  try {
    data = JSON.parse(readFileSync(path));
  } catch {
    throw new Error("Cannot read credential references; no contents printed.");
  }
  if (
    data.schemaVersion !== 1 ||
    data.projectId !== JSON.parse(readFileSync(".universal-app.json")).projectId
  )
    throw new Error(
      "Unrecognized credential reference file; refusing to overwrite.",
    );
  return Object.fromEntries(
    referenceNames
      .filter((name) => typeof data.references?.[name] === "string")
      .map((name) => [name, data.references[name]]),
  );
}
export function applyReferences(env = process.env) {
  const refs = loadReferences(env);
  for (const [name, value] of Object.entries(refs))
    if (!env[name]) env[name] = value;
  return env;
}
export function saveReferences(env = process.env) {
  const refs = { ...loadReferences(env) };
  for (const name of referenceNames) if (env[name]) refs[name] = env[name];
  const path = referencePath(env);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(
    path,
    JSON.stringify(
      {
        schemaVersion: 1,
        projectId: JSON.parse(readFileSync(".universal-app.json")).projectId,
        references: refs,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  chmodSync(path, 0o600);
  return path;
}
function requireValues(env, names) {
  for (const name of names)
    if (!env[name])
      throw new Error(
        "Missing " +
          name +
          ". Supply through environment/OS credential store; see docs/credentials.md.",
      );
}
function checked(command, args, env, runner = spawnSync) {
  const result = runner(command, args, {
    env,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0)
    throw new Error(
      "Credential validation failed. Check the file, alias, password, permissions and platform prerequisites. Sensitive tool output is suppressed.",
    );
  return result;
}
/** Validation-only: export the PUBLIC certificate, never a private key. */
export function validateAndroid(
  env = process.env,
  {
    runner = spawnSync,
    certificateFactory = (data) => new X509Certificate(data),
  } = {},
) {
  requireValues(env, [
    "ANDROID_KEYSTORE_PATH",
    "ANDROID_KEY_ALIAS",
    "ANDROID_STORE_PASSWORD",
    "ANDROID_KEY_PASSWORD",
  ]);
  const file = externalFile(env.ANDROID_KEYSTORE_PATH);
  if (!/\.(jks|keystore)$/i.test(file))
    throw new Error("Use a client-supplied .jks or .keystore file.");
  const result = checked(
    "keytool",
    [
      "-exportcert",
      "-rfc",
      "-keystore",
      file,
      "-alias",
      env.ANDROID_KEY_ALIAS,
      "-storepass:env",
      "ANDROID_STORE_PASSWORD",
    ],
    env,
    runner,
  );
  let certificate;
  try {
    certificate = certificateFactory(result.stdout);
  } catch {
    throw new Error("Keystore public certificate could not be validated.");
  }
  if (
    Date.parse(certificate.validTo) <= Date.now() ||
    Date.parse(certificate.validFrom) > Date.now()
  )
    throw new Error(
      "Signing certificate is expired or not yet valid. Contact the client key owner.",
    );
  const key = certificate.publicKey;
  if (
    key.asymmetricKeyType === "rsa" &&
    key.asymmetricKeyDetails?.modulusLength < 2048
  )
    throw new Error("RSA upload key must be at least 2048 bits.");
  return {
    fingerprint: certificate.fingerprint256,
    expires: certificate.validTo,
    note: "Key password and actual signing are verified only by a signed build.",
  };
}
export function validateIos(env = process.env, host = process.platform) {
  if (host !== "darwin")
    throw new Error(
      "BLOCKED: iOS credential/keychain validation requires macOS/Xcode. See docs/ios.md.",
    );
  requireValues(env, ["APPLE_TEAM_ID"]);
  if (!/^[A-Z0-9]{10}$/.test(env.APPLE_TEAM_ID))
    throw new Error(
      "APPLE_TEAM_ID must be the ten-character client team identifier.",
    );
  checked("xcodebuild", ["-version"], env);
  const identities = checked(
    "security",
    ["find-identity", "-v", "-p", "codesigning"],
    env,
  ).stdout;
  if (
    !identities.includes("(" + env.APPLE_TEAM_ID + ")") ||
    !/Apple (Development|Distribution)|iPhone (Developer|Distribution)/.test(
      identities,
    )
  )
    throw new Error(
      "No matching valid Apple development/distribution identity in the keychain.",
    );
  if (env.IOS_PROVISIONING_PROFILE) {
    const path = externalFile(env.IOS_PROVISIONING_PROFILE);
    const profile = checked("security", ["cms", "-D", "-i", path], env).stdout;
    const expiry = profile.match(
      /<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/,
    )?.[1];
    if (
      !profile.includes(env.APPLE_TEAM_ID) ||
      !expiry ||
      Date.parse(expiry) <= Date.now()
    )
      throw new Error("Provisioning team/expiry validation failed.");
  }
  if (env.IOS_EXPORT_OPTIONS)
    checked("plutil", ["-lint", externalFile(env.IOS_EXPORT_OPTIONS)], env);
  return {
    note: "Identity checked. Provisioning, export mode and store readiness require actual archive/export and device validation.",
  };
}
export function validateWindows(env = process.env, host = process.platform) {
  if (host !== "win32")
    throw new Error(
      "BLOCKED: Windows certificate-store/provider validation requires Windows. See docs/desktop.md.",
    );
  requireValues(env, ["WINDOWS_CERTIFICATE_SHA1"]);
  if (!/^[a-fA-F0-9]{40}$/.test(env.WINDOWS_CERTIFICATE_SHA1))
    throw new Error(
      "Supply the public 40-hex certificate thumbprint from CurrentUser/My.",
    );
  checked(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      '$c=Get-Item -LiteralPath ("Cert:\\CurrentUser\\My\\"+$env:WINDOWS_CERTIFICATE_SHA1); if (!$c.HasPrivateKey -or $c.NotAfter -le (Get-Date)) {exit 1}',
    ],
    env,
  );
  if (env.CSC_LINK) {
    requireValues(env, ["CSC_KEY_PASSWORD"]);
    checked(
      "openssl",
      [
        "pkcs12",
        "-in",
        externalFile(env.CSC_LINK),
        "-info",
        "-noout",
        "-passin",
        "env:CSC_KEY_PASSWORD",
      ],
      env,
    );
  }
  return {
    note: "Certificate-store reference checked; provider access and trust require an actual signed artifact and Authenticode verification.",
  };
}
export function validateMacos(env = process.env, host = process.platform) {
  if (host !== "darwin")
    throw new Error(
      "BLOCKED: Developer ID/keychain validation requires macOS. See docs/desktop.md.",
    );
  requireValues(env, ["CSC_NAME"]);
  if (env.DESKTOP_NOTARIZE === "1" && !env.APPLE_KEYCHAIN_PROFILE)
    throw new Error(
      "Notarization requires APPLE_KEYCHAIN_PROFILE; provision it interactively in the OS keychain.",
    );
  if (!env.CSC_NAME.startsWith("Developer ID Application:"))
    throw new Error(
      "CSC_NAME must identify the client Developer ID Application certificate.",
    );
  const identities = checked(
    "security",
    ["find-identity", "-v", "-p", "codesigning"],
    env,
  ).stdout;
  if (!identities.includes('"' + env.CSC_NAME + '"'))
    throw new Error("Developer ID identity not found or invalid.");
  if (env.APPLE_KEYCHAIN_PROFILE)
    checked(
      "xcrun",
      [
        "notarytool",
        "history",
        "--keychain-profile",
        env.APPLE_KEYCHAIN_PROFILE,
        ...(env.APPLE_KEYCHAIN
          ? ["--keychain", externalFile(env.APPLE_KEYCHAIN)]
          : []),
        "--output-format",
        "json",
      ],
      env,
    );
  return {
    note: "Signing identity and read-only notarization access checked. Signed/stapled distribution still requires artifact verification.",
  };
}
