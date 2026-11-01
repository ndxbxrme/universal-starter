# Run and package the desktop app

The desktop app uses the same screens, with native menus, file dialogs and local audio recording. Start unsigned during development. Before a client buys a certificate or signing service, agree a compatible arrangement using [Desktop signing](client-desktop.md).

## Start a development session

From the project root with Node 24 and dependencies installed:

```sh
npm run dev:desktop
```

The helper starts a loopback Vite server and Electron. Port 5173 must be free. Leave the terminal running while you work and press **Ctrl+C** to stop.

The renderer is sandboxed and isolated, with Node disabled. Shared screens use a small preload API; the main process validates calls. File selection uses a native dialog and returns metadata rather than unrestricted filesystem access. Navigation, windows, downloads and permissions are restricted. The Help menu can open only the configured HTTPS support path.

## Run the smoke test

```sh
npm run test:desktop
```

This builds production assets and launches a test-build window. Linux needs a display; headless CI uses `xvfb-run -a npm run test:desktop`. The test checks preload/sandbox isolation, actual clipboard IPC, validated arguments, blocked navigation/windows, offline screens and clean exit. It also tests generated-input audio. Native dialog selection is mocked, so a pass does not prove someone clicked a real OS dialog or recorded a physical microphone.

## Build an installer for your operating system

```sh
npm run build:desktop
```

Packages appear in `artifacts/desktop`:

| Build host | Output             |
| ---------- | ------------------ |
| Windows    | NSIS EXE installer |
| macOS      | DMG and ZIP        |
| Linux      | AppImage and DEB   |

The explicit `npm run build:desktop:win`, `npm run build:desktop:mac` and `npm run build:desktop:linux` commands require their matching hosts. Use the configured CI runners or another appropriate machine for other operating systems.

The host architecture is the default; this Linux development host is x64. An arm64 package needs an appropriate build/runner configuration and its own testing; electron-builder supports an explicit `--arm64` option. Artifact names include app, version, OS, architecture and channel. Desktop assets always come from `dist/native`, not the Pages build.

## Install a test package

Unsigned builds need no production credentials, but Windows and macOS can show security warnings. Agree any unsigned internal test in advance; do not promise warning-free public installation.

Linux AppImages may need FUSE/libfuse2 to mount. The AppImage's `--appimage-extract-and-run` mode is an alternative when FUSE is unavailable. Inspect DEB contents and install through the target distribution's package manager. Test installation, launch, permissions, uninstall and upgrades on the actual target OS.

## Add signing when the client is ready

Follow [Credentials](credentials.md) to validate the intended identity and key access. For beta/production builds, `DESKTOP_SIGN=1` enables signing; the helper defaults a signed build to the production channel if no channel is supplied.

| Target           | Existing supported configuration                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Windows          | `WINDOWS_CERTIFICATE_SHA1` selects the client's certificate/private key in the OS store/provider                                          |
| Mac signing      | `CSC_NAME` selects Developer ID Application in Keychain                                                                                   |
| Mac notarization | Approved `DESKTOP_NOTARIZE=1` upload, with `APPLE_KEYCHAIN_PROFILE` and optional `APPLE_KEYCHAIN` selecting existing Keychain credentials |

Default packaging strips signing inputs and stays unsigned. PFX input validation is available during onboarding, but packaging does not forward PFX passwords as SignTool arguments. Mac notarization likewise uses a saved profile rather than raw password/API-key arguments. Verify Authenticode on Windows and codesign/notarization/Gatekeeper on Mac outputs. The provider or certificate name alone is not proof of a successful signature.

## Try recording

Open **Interactions → Record an audio note**. Electron accepts only user-requested microphone audio from the trusted main frame, after confirmation; camera/screen capture and unrelated permissions remain denied. Export uses a validated, bounded IPC request and a native save dialog.

macOS packaging supplies the microphone purpose string and hardened-runtime audio-input entitlement. Physical inputs and Windows/macOS privacy prompts still need testing on those systems. See [Device showcase](device-showcase.md).

## Ubuntu sandbox setup

Some Ubuntu policies restrict unprivileged user namespaces. Electron then needs an administrator-provisioned trusted sandbox helper or an approved namespace policy. The original machine uses its existing root-owned, mode-4755 `/opt/google/chrome/chrome-sandbox` through `CHROME_DEVEL_SANDBOX`. Do not make arbitrary downloaded executables setuid.

Tests enable Playwright's Chromium sandbox explicitly and check `process.sandboxed` through preload. There is no production `--no-sandbox` workaround. The smoke timeout allows 90 seconds for cold startup on slower machines.

## How users get updates

Automatic updates are disabled; no updater is installed. Distribute approved installers with release notes/checksums and explain the manual update route. A future updater needs trusted signed feeds/artifacts and tests for interruption/recovery before being enabled. Do not replace shared JavaScript from an untrusted remote server.
