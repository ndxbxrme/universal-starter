import { readFileSync } from "node:fs";
import { assertReleaseChannel } from "./lib.mjs";
import { applyReferences } from "./credentials/lib.mjs";
import { createServer } from "vite";
import electronPath from "electron";
import { run, start, cli } from "./lib.mjs";
cli(async () => {
  applyReferences();
  const action = process.argv[2];
  if (action === "dev") {
    const server = await createServer({
      server: { host: "127.0.0.1", port: 5173, strictPort: true },
    });
    await server.listen();
    const child = start(electronPath, ["."], {
      env: { ...process.env, DESKTOP_DEV_URL: "http://127.0.0.1:5173/" },
    });
    let stopping = false;
    const close = () => {
      stopping = true;
      child.kill();
    };
    process.once("SIGINT", close);
    process.once("SIGTERM", close);
    child.once("exit", async (code) => {
      await server.close();
      process.exitCode = stopping ? 0 : (code ?? 1);
    });
    return;
  }
  const target =
    action === "build"
      ? { win32: "win", darwin: "mac", linux: "linux" }[process.platform]
      : action;
  if (target === "mac" && process.platform !== "darwin")
    throw new Error(
      "BLOCKED: build macOS DMG/ZIP on a macOS runner. See docs/desktop.md.",
    );
  if (target === "win" && process.platform !== "win32")
    throw new Error(
      "BLOCKED: build Windows NSIS on a Windows runner. See docs/desktop.md.",
    );
  if (target === "linux" && process.platform !== "linux")
    throw new Error("BLOCKED: build Linux packages on a Linux runner.");
  if (!["mac", "win", "linux"].includes(target))
    throw new Error("Unknown desktop target.");
  const config = JSON.parse(readFileSync("universal-app.config.json"));
  if (
    !config.targets.includes(
      { win: "windows", mac: "macos", linux: "linux" }[target],
    )
  )
    throw new Error("Desktop target is disabled in canonical config.");
  const signing = process.env.DESKTOP_SIGN === "1";
  if (signing) {
    process.env.APP_CHANNEL ||= "production";
    assertReleaseChannel(process.env.APP_CHANNEL);
  }
  run("npm", ["run", "build"]);
  if (signing && target === "win" && !process.env.WINDOWS_CERTIFICATE_SHA1)
    throw new Error(
      "Set WINDOWS_CERTIFICATE_SHA1 for a client-owned OS certificate-store/provider identity; see credentials.md.",
    );
  if (
    signing &&
    target === "mac" &&
    (!process.env.CSC_NAME ||
      (process.env.DESKTOP_NOTARIZE === "1" &&
        !process.env.APPLE_KEYCHAIN_PROFILE))
  )
    throw new Error(
      "Set CSC_NAME and APPLE_KEYCHAIN_PROFILE for client-controlled OS keychain signing/notarization.",
    );
  const buildEnv = { ...process.env };
  // Signing uses OS stores. Keep PFX/password credentials out of tool arguments.
  for (const key of [
    "CSC_LINK",
    "WIN_CSC_LINK",
    "WIN_CSC_KEY_PASSWORD",
    "CSC_KEY_PASSWORD",
    "APPLE_ID",
    "APPLE_APP_SPECIFIC_PASSWORD",
    "APPLE_API_KEY",
    "APPLE_API_KEY_ID",
    "APPLE_API_ISSUER",
  ])
    delete buildEnv[key];
  if (!signing)
    for (const key of [
      "CSC_NAME",
      "WINDOWS_CERTIFICATE_SHA1",
      "APPLE_KEYCHAIN_PROFILE",
      "APPLE_KEYCHAIN",
    ])
      delete buildEnv[key];
  run(
    "npx",
    [
      "electron-builder",
      "--config",
      "electron-builder.config.cjs",
      "--" + target,
      "--publish",
      "never",
    ],
    {
      env: {
        ...buildEnv,
        CSC_IDENTITY_AUTO_DISCOVERY:
          process.env.DESKTOP_SIGN === "1" ? "true" : "false",
      },
    },
  );
});
