# Getting started

Use Node 24 (the installed/tested local version is recorded in toolchain.md) and npm. From the repository root:

```sh
npm ci
npm run setup
npm run doctor
npm run dev
```

Open http://127.0.0.1:5173. Expected: responsive Home, navigation, platform/network status and themed cards. No production credentials, account or native SDK is required for web development. Stop with Ctrl+C. npm ci installs exact locked dependencies; setup synchronizes existing template metadata/artwork/licenses rather than generating another project. Commit the reviewed lockfile and source changes.

Run `npx playwright install chromium` before the first browser E2E run, then `npm run check`. Linux may need Playwright's documented system libraries (`npx playwright install-deps chromium`, an administrator task). `npm run build:web` emits dist/web; `npm run build` emits dist/native. For a Pages repository path, set WEB_BASE explicitly as described in development.md.

Install Android Studio/JDK/SDK for Android, macOS/Xcode for iOS, or use Electron for desktop. SDK setup is platform-specific; doctor reports blockers without pretending those targets were tested. On the implementation machine, local tools are loaded with `source "$HOME/.local/share/universal-toolchain/env.sh"`; a fresh clone should use its own SDK installation paths. See android.md, android-wireless.md, ios.md and desktop.md.

For a new client, choose a fresh provenance UUID and complete the guided identity migration before production credential onboarding. Documentation and verification.md disclose all device/account/signing steps that remain manual.
