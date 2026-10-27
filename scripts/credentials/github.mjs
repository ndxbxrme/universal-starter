import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { cli, option, isMain } from "../lib.mjs";
export const secretFormats = {
  ANDROID_STORE_PASSWORD: "UTF-8 keystore password; never a file",
  ANDROID_KEY_PASSWORD: "UTF-8 upload-key password; never a file",
  ANDROID_KEY_ALIAS: "Client upload-key alias (not the Play App Signing key)",
};
export const variableFormats = {
  RELEASE_ENABLED: "true only after environment/runners/approval review",
  ANDROID_KEYSTORE_PATH: "Absolute external path on protected signing runner",
  APPLE_TEAM_ID: "Client ten-character team ID",
  IOS_EXPORT_OPTIONS: "Absolute external reviewed ExportOptions.plist path",
  WINDOWS_CERTIFICATE_SHA1: "Public 40-hex OS certificate-store thumbprint",
  CSC_NAME: "Client Developer ID Application identity in OS keychain",
  APPLE_KEYCHAIN_PROFILE: "Existing notarytool OS-keychain profile name",
  APPLE_KEYCHAIN: "Optional external keychain path",
};
export function githubPlan(
  repo,
  environment,
  names = Object.keys(secretFormats),
) {
  if (
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo || "") ||
    !["beta", "production"].includes(environment)
  )
    throw new Error("Specify --repo OWNER/REPO --environment beta|production.");
  if (
    !names.length ||
    names.some((name) => !Object.hasOwn(secretFormats, name))
  )
    throw new Error(
      "Unsupported secret name. This utility does not upload private keys/certificates.",
    );
  return {
    repo,
    environment,
    secrets: names.map((name) => ({ name, format: secretFormats[name] })),
    variables: variableFormats,
  };
}
function gh(args, input) {
  const result = spawnSync("gh", args, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0)
    throw new Error(
      "GitHub operation failed. Check gh authentication/admin permissions and protected environment configuration. Sensitive output suppressed.",
    );
  return result.stdout;
}
if (isMain(import.meta.url))
  cli(async () => {
    if (process.argv.includes("--help")) {
      console.log(
        "credentials:github:plan --repo OWNER/REPO --environment beta|production [--names NAME,NAME]; credentials:github:sync adds --confirm OWNER/REPO/ENVIRONMENT (or interactive confirmation). --dry-run never writes or authenticates. Environment secret values are streamed through stdin to gh; private signing files are never uploaded. See docs/credentials.md.",
      );
      return;
    }
    const repo = option("repo"),
      environment = option("environment"),
      names = option("names")?.split(",");
    const plan = githubPlan(repo, environment, names);
    console.log(JSON.stringify(plan, null, 2));
    if (process.argv[2] === "plan" || process.argv.includes("--dry-run"))
      return;
    for (const { name } of plan.secrets)
      if (!process.env[name])
        throw new Error("Missing selected secret environment input: " + name);
    gh(["auth", "status"]);
    const info = JSON.parse(gh(["api", `repos/${repo}`]));
    if (!info.permissions?.admin)
      throw new Error(
        "Repository admin permission is required for protected-environment secret onboarding.",
      );
    gh(["api", `repos/${repo}/environments/${environment}`]);
    const target = `${repo}/${environment}`;
    let confirmation = option("confirm");
    if (
      !confirmation &&
      !process.argv.includes("--non-interactive") &&
      stdin.isTTY
    ) {
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        confirmation = await rl.question(
          "Authorize writing the displayed secret names by typing " +
            target +
            ": ",
        );
      } finally {
        rl.close();
      }
    }
    if (confirmation !== target)
      throw new Error("No matching explicit confirmation; no secrets written.");
    for (const { name } of plan.secrets) {
      gh(
        ["secret", "set", name, "--repo", repo, "--env", environment],
        process.env[name],
      );
      console.log("Updated secret name:", name);
    }
    console.log(
      "PASS: selected secret writes completed. CI signing and store publication still require real artifact verification.",
    );
  });
