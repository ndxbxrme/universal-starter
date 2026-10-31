# Universal Starter

[![CI: remote run pending](docs/images/ci-status.svg)](.github/workflows/ci.yml)

One vanilla HTML/CSS/JavaScript SPA for web, Android, iOS, Windows, macOS and Linux. Vite compiles the shared UI; Capacitor and a hardened Electron wrapper supply narrow native adapters. No UI framework, TypeScript, backend or production signing credentials are required for ordinary development. The badge above is an honest static status until remote workflows are enabled; use GitHub's workflow badge URL after configuring your repository.

```sh
npm ci
npm run setup
npm run dev
```

Use Node 24. Open http://127.0.0.1:5173; stop with Ctrl+C. Expect responsive Home/Capabilities/Interactions/Diagnostics/Settings, themes, touch/keyboard carousel, offline status and real capability support/permission results. Install the test browser with `npx playwright install chromium`, then `npm run check`. Native prerequisites are reported by `npm run doctor`.

[Desktop preview](docs/images/home-desktop.png) · [Phone preview](docs/images/home-phone.png) · [Actual verification matrix](docs/verification.md)

| Target  | Command                                        | Prerequisites/output                                |
| ------- | ---------------------------------------------- | --------------------------------------------------- |
| Web     | `npm run build:web`                            | dist/web; explicit WEB_BASE for Pages project sites |
| Android | `npm run build:android`                        | JDK 21/API 36 SDK; bundled debug APK                |
| iOS     | `npm run build:ios`                            | macOS/Xcode 26+; unsigned simulator .app            |
| Desktop | `npm run dev:desktop`, `npm run build:desktop` | Electron; host NSIS, DMG/ZIP or AppImage/DEB        |

Android/iOS projects are included and equal-priority. This Linux host builds Android/debug+unsigned release and Linux desktop artifacts. iOS/other OS compilation, KVM/device runtime smoke, wireless deployment, signing, Pages and stores remain explicitly disclosed where unverified. A simulator app is not an iPhone IPA; an unsigned AAB is not ready for Play. No releases/accounts/secrets have been published/configured.

Customize universal-app.config.json, validate/sync metadata and regenerate the single icon master. Identifiers require a guided reviewed migration; client credentials can be onboarded later without recreating projects. V1 documents future generator/updater design but does not implement it. Automatic desktop updates are disabled until trusted signed updates are configured/tested. Code and original artwork use MIT; runtime dependency notices are bundled in Settings and resources/THIRD_PARTY_NOTICES.txt.

The [device showcase](docs/device-showcase.md) adds foreground GPS, finger-following carousel snapping, native system preferences, camera/photos, battery/language/orientation/motion/lifecycle and local audio recording/playback/export on web, Android/iOS and Electron. Native features need a rebuild/reinstall; support and permissions are reported honestly.

Documentation:

- [Getting started](docs/getting-started.md), [commands and flags](docs/commands.md), [tested toolchain](docs/toolchain.md), [development](docs/development.md)
- [Architecture/contract](docs/architecture.md), [customisation](docs/customisation.md), [template ownership/upgrades](docs/template-and-upgrades.md)
- [Android](docs/android.md), [USB-free wireless Android](docs/android-wireless.md), [iOS](docs/ios.md), [desktop](docs/desktop.md)
- [Testing](docs/testing.md), [GitHub Actions/Pages](docs/github-actions.md), [credentials/client handoff](docs/credentials.md)
- [Beta testing](docs/beta-testing.md), [store publishing](docs/store-publishing.md), [releases/updates](docs/releases-and-updates.md), [release checklist](docs/release-checklist.md)
- [Security](docs/security.md), [privacy policy template](docs/privacy-policy-template.md), [troubleshooting](docs/troubleshooting.md), [known limitations](docs/known-limitations.md)
