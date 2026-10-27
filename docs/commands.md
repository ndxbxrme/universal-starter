# Command reference

Run from the repository root with Node 24 after npm ci. This table is synchronized with package.json; unknown SDK/OS/device/credential prerequisites fail with an actionable message, never a fake success. Native commands do not require production credentials unless explicitly signing/exporting. Use npm's `--` separator before flags.

| npm script                          | Actual behaviour                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`                       | Start shared Vite on loopback port 5173                                                  |
| `npm run dev:web`                   | Alias of dev                                                                             |
| `npm run build`                     | Native-safe production compilation to dist/native                                        |
| `npm run build:web`                 | Static web compilation to dist/web; WEB_BASE is explicit                                 |
| `npm run test`                      | Vitest unit tests; mocks do not prove native integration                                 |
| `npm run test:watch`                | Vitest watch mode                                                                        |
| `npm run test:e2e`                  | Production subpath Chromium desktop/phone browser tests                                  |
| `npm run lint`                      | ESLint JavaScript checks                                                                 |
| `npm run format`                    | Prettier source/docs formatting (native/lock/generated binary exclusions)                |
| `npm run format:check`              | Read-only formatting check                                                               |
| `npm run check`                     | Lint + format check + unit + browser E2E (does not include native/audit)                 |
| `npm run cap:sync`                  | Build native assets and sync both mobile projects                                        |
| `npm run cap:sync:android`          | Build and sync Android only                                                              |
| `npm run cap:sync:ios`              | Build and sync iOS only (sync does not compile Swift)                                    |
| `npm run build:android`             | Sync/build bundled debug APK with JDK/SDK                                                |
| `npm run build:android:release`     | Release AAB; configured signing or explicitly unsigned output                            |
| `npm run android:pair`              | Interactive Android 11+ ADB pairing/connect addresses and phone code                     |
| `npm run android:devices`           | ADB device inventory                                                                     |
| `npm run android:install`           | Install existing debug APK; optional --device SERIAL                                     |
| `npm run android:logs`              | PID-filtered logcat for a running app; optional --device SERIAL                          |
| `npm run android:open`              | Open Android Studio                                                                      |
| `npm run dev:android`               | Guided debug-only LAN reload/build/install/launch; requires --host and optional --device |
| `npm run icons:generate`            | Regenerate web/desktop/mobile artwork from one SVG master                                |
| `npm run test:android`              | Build, install, instrumentation and Maestro against an available device                  |
| `npm run test:ios`                  | macOS build/install/Maestro on booted simulator                                          |
| `npm run test:mobile`               | Run Android and, on macOS, iOS; explicitly report unsupported host                       |
| `npm run build:ios`                 | macOS simulator .app, unsigned; optional --device UDID                                   |
| `npm run build:ios:release`         | macOS archive/export with matching keychain/profile/team/export options                  |
| `npm run dev:ios`                   | macOS: build/sync bundled assets and open Xcode                                          |
| `npm run ios:open`                  | macOS: open existing Xcode project                                                       |
| `npm run dev:desktop`               | Start loopback Vite plus sandboxed Electron; port must be free                           |
| `npm run build:desktop`             | Host OS package set; unsigned by default                                                 |
| `npm run build:desktop:win`         | Windows NSIS on Windows                                                                  |
| `npm run build:desktop:mac`         | macOS DMG/ZIP on macOS                                                                   |
| `npm run build:desktop:linux`       | Linux AppImage/DEB on Linux                                                              |
| `npm run test:desktop`              | Build and run real sandbox-enabled Electron smoke                                        |
| `npm run security:audit`            | npm audit; moderate+ advisories fail                                                     |
| `npm run verify:repository`         | Config/script/action-pin/production CSP and Git secret-inventory checks                  |
| `npm run artifacts`                 | Stage known outputs/checksums/notes; pass web/android/ios/desktop                        |
| `npm run credentials:status`        | Redacted development/local/CI/store readiness; --json/--verify-artifacts                 |
| `npm run release:prepare`           | Validate reviewed identity/versions/changelog/clean Git; generate notes, no publication  |
| `npm run release`                   | Validate and print protected tag/dispatch steps, no push/publish                         |
| `npm run config:validate`           | Validate app/provenance schemas and initialized identity                                 |
| `npm run config:sync`               | Patch managed metadata; --dry-run supported; never silently rename IDs                   |
| `npm run identity:plan`             | Print a guided native ID migration plan without modifying projects                       |
| `npm run doctor`                    | Read-only tool/SDK/KVM and per-stage credential readiness                                |
| `npm run deps:check`                | Report outdated direct dependencies and audit moderate+ advisories                       |
| `npm run deps:update`               | Controlled explicit package/version update plan; --apply needed for mutations            |
| `npm run credentials:setup:android` | Validate client external keystore/alias/public certificate; no issuance/import           |
| `npm run credentials:setup:ios`     | macOS team/keychain/optional profile/export plist validation                             |
| `npm run credentials:setup:windows` | Windows OS certificate-store/private-key/expiry and optional PFX validation              |
| `npm run credentials:setup:macos`   | Developer ID validation; optional read-only notarization-profile validation              |
| `npm run credentials:github:plan`   | Redacted names/formats for explicit repo + protected environment                         |
| `npm run credentials:github:sync`   | Opt-in confirmed selected Android secrets via gh stdin; --dry-run is non-destructive     |
| `npm run setup`                     | Idempotent metadata/icons/licenses; explicit new-project UUID options                    |
| `npm run licenses:generate`         | Bundle runtime dependency license notices                                                |
| `npm run test:release-guard`        | Real Android Gradle negative release-config test with restoration                        |
| `npm run verify:native`             | Inspect generated native bundled assets; pass android or ios                             |
| `npm run verify:docs`               | Verify specified npm scripts, documented commands and local documentation links          |

Flags and environment:

- Web: WEB_BASE is a root-relative path ending in /, e.g. /repository-name/; native build ignores it. APP_CHANNEL is dev/ci/beta/production. Signed/release builds permit beta/production only. Server ports are strict, so stop an existing dev process first.
- Android: JAVA_HOME points to JDK 21; ANDROID_HOME to API 36 SDK, with platform-tools/ADB on PATH. Pass --device SERIAL for install/logs/test, or --host PRIVATE_LAN_IP --device SERIAL for dev:android. android:pair prompts for distinct pairing/debug ports and delegates the hidden pairing code to adb. --help explains mobile actions. Debug install requires a previously built APK.
- iOS: macOS/Xcode 26+; --device SIMULATOR_UDID selects a simulator for build/test. dev:ios syncs/opens bundled development rather than LAN serving. NODE_BINARY can select Node for Xcode's Release guard. APPLE_TEAM_ID and IOS_EXPORT_OPTIONS are required for release export; optional IOS_PROVISIONING_PROFILE is a client-supplied external validation reference. scripts/ios-simulator.mjs selects/boots an available iPhone, optionally IOS_SIMULATOR_UDID, and exports its ID in GitHub Actions.
- Desktop: DESKTOP_SIGN=1 is an explicit signing opt-in. Windows uses WINDOWS_CERTIFICATE_SHA1 selecting a client OS certificate store/provider. macOS uses CSC_NAME (Developer ID Application in Keychain). DESKTOP_NOTARIZE=1 separately opts into Apple's upload, with APPLE_KEYCHAIN_PROFILE and optional APPLE_KEYCHAIN. Raw PFX/Apple password/API-key signing variables are stripped before packaging; see credentials.md. Linux tests need a display and supported sandbox policy; CHROME_DEVEL_SANDBOX can reference an existing trusted installed helper. ELECTRON_SMOKE_EXECUTABLE selects an already packaged executable for the smoke test. No --no-sandbox fallback is used.
- Credentials: every setup utility supports --help, --non-interactive, --dry-run and --save-references. Android needs ANDROID_KEYSTORE_PATH/ANDROID_KEY_ALIAS/ANDROID_STORE_PASSWORD/ANDROID_KEY_PASSWORD; passwords are environment/hidden TTY only. Optional Windows CSC_LINK/CSC_KEY_PASSWORD validate an external PFX with OpenSSL; actual signing uses the OS store. UNIVERSAL_CREDENTIALS_FILE overrides only the external non-secret reference file. No password/key is persisted. status supports --json and --verify-artifacts; the latter performs real available signature checks and can be slow.
- GitHub credential utilities require --repo OWNER/REPO --environment beta|production; --names NAME,NAME narrows Android secret selection. plan/--dry-run do not authenticate/write. Actual sync requires gh authentication/admin access, existing protected environment and exact typed target confirmation; --non-interactive requires --confirm OWNER/REPO/ENVIRONMENT. Values stream via stdin, never arguments/files/logs. Private file uploads are not supported. Do not execute sync without account-owner authorization.
- Updates: deps:update requires --package NAME --version X.Y.Z. Default/--dry-run prints a plan. --apply changes package/lock; --allow-major additionally acknowledges a major-version review. Run all affected checks after applying.
- Template setup: config:sync supports --dry-run; identity:plan is read-only. setup optionally takes --project-id UUID --new-project to explicitly initialize a new client's provenance, without touching native IDs/credentials. Repeat with the same UUID is idempotent. Review ownership and native migration guidance first.
- Artifacts: pass web/android/ios/desktop; APP_CHANNEL controls names. RELEASE_BUILD=1 selects release AAB/IPA rather than debug APK/simulator app. Only generated staging output for that target is replaced. release utilities have --help; preparation intentionally fails on placeholder IDs/URLs or uncommitted source. Actual publication is gated by protected manual workflows and owner approval.
- CI-only helper inputs: RELEASE_ENABLED=true, RELEASE_TARGET, APP_CHANNEL, RELEASE_BUILD and GitHub-provided tag/commit metadata gate distribution workflows. Apple/Windows identities must already exist on isolated client-signing runners. No PR job consumes these secrets. Maestro telemetry is disabled by the test script; the pinned installer accepts --dir for an external tools directory and adds its bin to GITHUB_PATH on CI.

Examples (replace non-secret paths/device IDs with your own):

```sh
npm run config:sync -- --dry-run
npm run verify:native -- android
npm run artifacts -- desktop
npm run deps:update -- --package vite --version 8.3.5 --dry-run
npm run credentials:github:plan -- --repo client/project --environment beta
npm run credentials:github:sync -- --repo client/project --environment beta --dry-run
```

These planning commands do not publish or synchronize secrets. Use platform guides for real signing/device/export prerequisites and verification.md for actual test evidence.
