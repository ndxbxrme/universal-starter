# Universal Vanilla JavaScript App Starter — Codex Implementation Specification

**Status:** Implementation-ready specification  
**Version:** 1.1  
**Primary goal:** A reusable, polished starter repository with **one vanilla HTML/CSS/JavaScript SPA** distributed to the web, Android, iOS, Windows, macOS, and Linux.

## 1. Instructions to Codex

Implement this specification in the repository, in the ordered phases in §17. Do not merely produce plans or mockups. Create working source, native projects, tests, workflows, documentation, and example assets. Run every feasible verification step. Clearly report steps blocked by unavailable operating systems, SDKs, signing credentials, physical devices, or external accounts. Never claim that a build, test, signing step, upload, or installer was verified unless it actually ran successfully.

Choose current compatible **stable** versions of dependencies when implementing, checking official release notes and compatibility matrices. Commit `package-lock.json`, pin the Node major version and CI action versions, and record exact tested versions in `docs/toolchain.md`. Do not assume a version number in this specification is the latest.

### Non-negotiable requirements

1. Shared UI is **vanilla JavaScript with native ES modules**, HTML and CSS. **No TypeScript, React, Vue, Angular, Svelte, or other UI framework.** JSDoc type hints are welcome.
2. Use **Vite** for the web build and dev server, **Capacitor** for Android/iOS, **Electron** for Windows/macOS/Linux, **electron-builder** for desktop packaging, and **GitHub Pages** for the public web demo.
3. The **same compiled SPA assets** are used by all wrappers, subject only to runtime configuration and secure, platform-specific bridge implementations. Do not fork the UI by platform.
4. Android and iOS are **equal-priority, first-class targets**. Include both native projects, workflows, docs and test coverage plans.
5. Native functionality is accessed through a narrow, documented platform adapter API; shared feature components never directly import Capacitor or Electron internals.
6. Production native applications bundle their SPA assets locally and work offline for core demo functions. Never ship a live-reload/dev-server URL in production.
7. Default setup builds and tests without production signing credentials. Signing and publishing are explicit, protected, opt-in workflows.
8. Do not commit secrets, keystores, provisioning profiles, API keys, private certificates or local machine addresses.
9. All documented npm scripts must exist and perform the stated function or produce a clear, actionable prerequisite error.
10. Deliver a professional, accessible, responsive demo and usable placeholder branding; no unlicensed imagery.
11. Architect V1 for a future project-generator/updater CLI, but **do not build or publish the CLI in V1**.
12. Support **late credential onboarding**: clients can develop and test without production signing material, then safely configure locally supplied signing assets and GitHub Actions secrets when ready.

## 2. Product and scope

**Working title:** Universal Starter (easily renamed). **Example reverse-DNS identifier:** `dev.example.universalstarter` (explicitly a placeholder to replace before publication). Use a single configuration source for display name, bundle/application IDs, version, support URL, theme colours, and release channels; generate/synchronise platform metadata where safe. Renaming package IDs after initial native project creation requires an explicit guided migration rather than silent mutation.

### In scope

- Static SPA with responsive, keyboard-accessible, touch-friendly navigation; theme selection; light/dark/system modes; offline status; diagnostics; and capability demos.
- Capacitor Android and iOS projects, permission handling, splash screens and icons, native build configurations.
- Secure Electron main/preload/renderer separation, native desktop integrations, OS-specific packages.
- Automated unit, browser E2E, desktop smoke, Android emulator smoke and iOS simulator smoke tests where runners/tooling support them.
- CI validation, build artifacts, staged beta and production release workflows, publishing documentation.
- Wireless Android debugging and LAN live reload, **without requiring USB** on supported Android versions.
- Web deployment to GitHub Pages, including SPA navigation and base-path correctness.
- Complete plain-language setup, distribution, signing, store and troubleshooting docs.

### Out of scope for initial implementation

- User accounts, hosted backend, analytics, push-notification server, paid services, app monetisation, or database sync.
- Silent over-the-air replacement of native app code; use store/installer updates for native releases.
- A published scaffolding CLI, automatic project migrations, or automatic certificate/identity issuance. These belong to later milestones.
- Pretending that browser, desktop and mobile APIs are identical. Unsupported features must be labelled and disabled or handled with a documented fallback.

## 3. Architecture

```text
src/                       # ONE shared HTML/CSS/JS SPA
  index.html               # or root index.html per Vite convention
  main.js
  app/                     # views, router, state, components
  styles/                  # responsive styles, tokens, themes
  platform/
    index.js               # getPlatform(), stable public contract
    contract.js            # documented interface and JSDoc
    web.js                 # browser/PWA adapter
    capacitor.js           # Android/iOS adapter
    electron.js            # desktop adapter via window bridge
    capabilities.js        # capability/permission status model
  features/                # demo features, no direct native imports
  assets/
electron/
  main.cjs                 # or ESM, as compatible with tooling
  preload.cjs              # narrow, validated IPC surface
  security/                # protocol, navigation, CSP helpers
android/                   # committed Capacitor native project
ios/                       # committed Capacitor native project
scripts/                   # portable Node.js automation and diagnostics
resources/                 # icon master, splash sources, generated assets
public/                    # web public assets and manifest
.github/workflows/
tests/unit/
tests/e2e/
tests/electron/
tests/mobile/
docs/
AGENTS.md
CODEX_PROJECT_SPEC.md
package.json
package-lock.json
vite.config.js
capacitor.config.*          # JS/JSON, not TS
playwright.config.js
vitest.config.js
```

Prefer cross-platform Node.js scripts to shell-only scripts. Keep wrapper-specific configuration out of the shared SPA. Do not expose Node APIs, raw IPC, filesystem access or native plugin objects to web content.

### Platform contract

Implement a promise-based API approximately as follows; refine signatures as needed and document the final contract:

```js
const platform = await getPlatform();
const info = await platform.device.getInfo();
const capabilities = await platform.capabilities.list();
await platform.notifications.show({ title: 'Hello', body: 'Demo notification' });
await platform.haptics.vibrate({ durationMs: 50 });
const picked = await platform.files.pick({ accept: ['image/*'] });
await platform.clipboard.writeText('Hello');
const status = await platform.network.getStatus();
const unsub = platform.network.subscribe((next) => console.log(next));
```

Capabilities must return `supported`, `permission` (`granted`, `denied`, `prompt`, `unavailable`, `unknown`) and optional `reason`. Feature calls return consistent values or typed error codes (`UNSUPPORTED`, `PERMISSION_DENIED`, `CANCELLED`, `FAILED`). User gestures must initiate permission prompts. `getPlatform()` must distinguish `web`, `android`, `ios`, `windows`, `macos`, `linux`, and release channel, without trusting an unverified user-agent string as proof of a privileged bridge.

**Adapter selection:** detect Electron only through a safely exposed preload bridge; detect Capacitor through the official runtime API; otherwise use browser adapter. Keep mobile-specific imports inside adapter modules. Browser notifications require secure context and permission and may not work on all platforms. Distinguish **local notifications** from **remote push notifications**; the demo needs only local notifications where supported. Haptics on the web may be unavailable. Filesystem access should use browser file input where appropriate and secure native dialogs for desktop.

## 4. Demo application requirements

Create a coherent visual system: consistent spacing, typography, icons, cards, empty/error/loading states, platform-specific polish, touch targets, focus rings, keyboard navigation, reduced-motion support, colour contrast and high-DPI assets. No generic unstyled demo buttons. Use self-created or permissively licensed icon assets and document their provenance.

Views:

1. **Home:** app identity, detected platform, version/build/channel, online status, shortcuts.
2. **Capabilities:** live supported/unsupported/permission matrix and explanation.
3. **Interactions:** swipeable card/carousel with touch and pointer support, haptics, local notification, clipboard, file picker, network status, share sheet if supported, and device info. A desktop-only example should demonstrate a native menu or native file dialog. Each demo must show success, cancellation, failure and unsupported states honestly.
4. **Diagnostics:** runtime versions, adapter selection, permission status, build metadata, non-sensitive in-app event log, copy diagnostics button.
5. **Settings:** light/dark/system theme, reset demo state, reduced-motion preference respect, about/licenses.

Demonstrate safe-area insets on mobile, Android back-button handling, iOS gesture expectations, desktop window resizing and web browser history. Use a simple hash router by default for GitHub Pages compatibility; document any alternate fallback strategy. Add a PWA manifest and optional carefully scoped service worker for web offline behaviour; do not register a web service worker inside native wrappers unless tested and justified. Ensure the demo does not collect or transmit personal data.

## 5. Web and GitHub Pages

- `npm run build:web` emits static assets into `dist/web` (or another documented stable path).
- Support GitHub Pages **project-site** base paths (`/<repository>/`) and optional custom domains; configure Vite `base` from an explicit build setting, not by guessing at runtime.
- Internal links, asset paths, icons, manifest scope and service-worker paths must work under a subpath. Test a non-root base path.
- GitHub Pages workflow uses official artifact upload/deploy actions and `pages: write`, `id-token: write` permissions only where required. Deployment environment is `github-pages`.
- Web deployments are distinct from native release builds; native assets must not inherit a Pages base path.
- Document repository settings required to enable Actions-based Pages deployment and how to inspect the deployed URL.

## 6. Mobile: Capacitor Android and iOS

- Commit native projects and platform configurations; do not regenerate them destructively on every build.
- Use supported Capacitor packages for local notifications, haptics, device information, network status and other chosen demos. Avoid plugins that are unmaintained or require unnecessary permissions.
- Provide debug and release variants; increment Android `versionCode` and iOS `CFBundleVersion` independently of human-readable semantic version.
- Android release produces **AAB** for Play and optionally signed APK for direct beta installation. Debug produces installable APK.
- iOS simulator produces an unsigned simulator-compatible app; signed device/TestFlight builds require Apple certificates, provisioning, team ID and App Store Connect access. Do not call a simulator `.app` an installable iPhone IPA.
- Specify supported minimum Android API and iOS versions based on selected stable Capacitor/toolchain compatibility and document them.
- Handle Android notification permission on modern OS versions and iOS notification authorisation, explaining denied/permanently denied states.
- Production content is bundled, with no remote code-loading shortcut to evade store review.
- Include application icons and splash screens generated from a single source, with adaptive Android icons and appropriate iOS icon variants.

### Wireless Android development — mandatory

Create `docs/android-wireless.md` and scripts for **Android 11+ wireless debugging pairing without USB**:

```sh
adb pair PHONE_IP:PAIRING_PORT       # enter pairing code shown on phone
adb connect PHONE_IP:DEBUG_PORT     # separate port, shown in wireless debugging
adb devices -l
npm run android:install
npm run android:logs
```

Document how to enable developer options and wireless debugging, how to obtain pairing and connect addresses, pairing-code expiry, device authorisation, same-LAN requirements, mDNS limitations, firewall/VPN/client-isolation issues, device disconnections and reconnection. Provide an interactive `npm run android:pair` helper that asks for addresses/ports rather than hard-coding them. ADB must be on `PATH`; `npm run doctor` checks it. Clearly state that older Android versions may require an initial USB connection and therefore cannot be guaranteed to work with a broken USB socket.

Provide `npm run dev:android` for LAN live reload: start Vite bound to a selectable LAN interface, configure Capacitor dev-server URL from a **temporary, explicitly enabled development-only** setting, sync/run over wireless ADB, and restore or isolate config so release builds cannot include the dev URL. Prefer no persistent LAN IP in tracked files. Explain HTTPS/cleartext allowances needed for development and prevent them leaking into release. Provide `npm run android:install` for normal bundled debug APK installation over wireless ADB and `npm run android:logs` for filtered `logcat` output. A native plugin change requires rebuilding/syncing, even with live reload.

### iOS development — mandatory

Document Xcode and macOS requirements, simulator selection, local `npm run dev:ios`, native build and debugging, signing a development build for a physical iPhone, trust/developer mode requirements, wireless device deployment when supported by Xcode, and TestFlight distribution. Do not claim that iOS native compilation or signing works on Linux/Windows. macOS runners may incur cost or have provisioning constraints.

## 7. Desktop: Electron

- Electron main process creates hardened windows; `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` where compatible, `webSecurity: true`.
- Expose only a **small allowlisted API** through `contextBridge` and validated IPC channels; never expose `ipcRenderer` wholesale. Validate argument shapes, file paths and message origins; avoid renderer-supplied arbitrary file paths.
- Block unexpected navigation and window creation; open allowlisted external URLs through OS browser with validated protocols. Deny untrusted permissions by default.
- Apply a restrictive Content Security Policy suitable for production. Avoid `eval`, inline scripts, remote code, and permissive wildcard origins.
- Package with electron-builder: Windows NSIS installer (optionally portable ZIP), macOS DMG (and ZIP for updates), Linux AppImage and DEB. Clearly document architecture support (x64/arm64) and what is actually built/tested per runner.
- Include proper app icons: `.ico`, `.icns`, PNG variants. Add native menus and a file-open dialog demo.
- Desktop update strategy: design for signed, versioned GitHub Releases using a maintained updater mechanism compatible with electron-builder. **Do not enable automatic installation of unsigned or untrusted updates.** Where signing/notarization is unavailable, document manual updates and keep automatic updating disabled.
- macOS distribution requires Developer ID signing and notarization for a normal trusted outside-store experience; Windows code signing is strongly recommended to reduce warnings. Do not promise warning-free installers without these credentials.

## 8. NPM command contract

Implement **all** commands below as actual `package.json` scripts. Scripts may call `scripts/*.mjs`; use `npm ci` for reproducible CI. If an operation is OS-specific, fail early with a helpful message and documentation link. Avoid scripts that silently succeed without doing anything.

| Command | Required behaviour |
|---|---|
| `npm run dev` | Start Vite shared web dev server |
| `npm run dev:web` | Alias to web dev server |
| `npm run dev:android` | Guided LAN live reload + wireless Android launch |
| `npm run dev:ios` | Sync and open/run iOS dev app or simulator, on macOS |
| `npm run dev:desktop` | Start Vite + Electron in development |
| `npm run build` | Build shared SPA with production-safe default |
| `npm run build:web` | Build GitHub Pages-compatible web bundle |
| `npm run build:android` | Sync and create Android debug APK |
| `npm run build:android:release` | Create release AAB; sign only with configured credentials; otherwise explicit failure or separate unsigned artifact |
| `npm run build:ios` | Build iOS simulator app on macOS |
| `npm run build:ios:release` | Archive/export signed iOS release with required credentials |
| `npm run build:desktop` | Build desktop package for host OS |
| `npm run build:desktop:win` | Windows package on supported runner |
| `npm run build:desktop:mac` | macOS package on macOS runner |
| `npm run build:desktop:linux` | Linux package on supported runner |
| `npm run cap:sync` | Build shared assets and sync both mobile projects, with correct native base |
| `npm run cap:sync:android` | Sync Android only |
| `npm run cap:sync:ios` | Sync iOS only |
| `npm run android:pair` | Guided wireless ADB pairing and connection |
| `npm run android:devices` | Show connected devices |
| `npm run android:install` | Install current debug APK on chosen ADB device |
| `npm run android:logs` | Stream relevant Android logcat |
| `npm run android:open` | Open Android project in Android Studio |
| `npm run ios:open` | Open iOS project in Xcode, macOS only |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run Playwright browser E2E tests |
| `npm run test:desktop` | Electron smoke/integration tests |
| `npm run test:android` | Android emulator smoke tests when SDK/emulator available |
| `npm run test:ios` | iOS simulator smoke tests on macOS |
| `npm run test:mobile` | Run available Android and iOS tests; report unsupported host clearly |
| `npm run lint` | ESLint JavaScript/style checks |
| `npm run format` | Format source/docs with Prettier |
| `npm run format:check` | Check formatting without changes |
| `npm run check` | Lint, format check, unit tests and browser E2E as feasible locally; document exact scope |
| `npm run doctor` | Validate Node, npm, Java, Android SDK, ADB, Xcode/macOS, environment and signing readiness |
| `npm run icons:generate` | Generate platform icons/splashes from source assets |
| `npm run deps:check` | Report outdated packages and relevant advisories |
| `npm run deps:update` | Guided controlled dependency update, never force major upgrades silently |
| `npm run security:audit` | Run dependency audit with documented policy |
| `npm run release:prepare` | Validate semver, changelog, build numbers and release readiness; do not publish |
| `npm run release` | Explicit release entry point that validates prerequisites and documents/initiates protected tag workflow; never silently publish |

| `npm run credentials:status` | Report per-platform signing readiness without exposing secret values; works with no credentials |
| `npm run credentials:setup:android` | Guided import/reference and validation of a **client-supplied** Android upload keystore and signing metadata; no secret commits |
| `npm run credentials:setup:ios` | Guided validation of Apple team, certificate/profile or supported signing workflow; require macOS/Xcode for local keychain operations |
| `npm run credentials:setup:windows` | Guided configuration/validation of client-supplied Windows signing credentials or provider integration |
| `npm run credentials:setup:macos` | Guided validation of Developer ID signing identity and notarization credentials on macOS |
| `npm run credentials:github:plan` | Show required GitHub Actions environment secrets/variables and a redacted, non-destructive setup plan |
| `npm run credentials:github:sync` | **Explicit opt-in** sync of selected secrets via authenticated GitHub CLI/API, after confirmation and authorization; never log secret contents |

Document exact environment variables and flags for all scripts. Prefer consistent `-- --device ...` pass-through where applicable. Scripts must never automatically write credentials to the repository.

## 9. GitHub Actions design

Create separate workflows, with minimal permissions, concurrency controls, dependency caching, `npm ci`, pinned action versions, and artifact retention settings:

| Workflow | Trigger | Jobs/output |
|---|---|---|
| `ci.yml` | PR, push to main | Lint, formatting, unit tests, browser E2E, production web build, security checks |
| `pages.yml` | Successful main validation or explicit dispatch | GitHub Pages artifact and deploy; correct repository base path |
| `android.yml` | PR/main/manual | Android debug APK, emulator smoke test; uploaded artifact |
| `ios.yml` | PR/main/manual | macOS simulator build and smoke test; uploaded artifact |
| `desktop.yml` | PR/main/manual | Matrix Windows/macOS/Linux builds and smoke tests; OS-specific artifacts |
| `beta.yml` | Manual dispatch / protected prerelease tag | Signed beta where credentials configured; tester distribution staging |
| `release.yml` | Protected version tag / manual approval | Validate version, sign, notarize as appropriate, create draft GitHub Release, attach assets, optionally upload to stores |
| `dependencies.yml` or Dependabot config | Scheduled | Safe dependency update PRs and checks |

For PRs from forks, do not expose secrets or run untrusted code with privileged credentials. Avoid `pull_request_target` for untrusted builds. Use GitHub Environments for `beta` and `production`, with approvals and protected secrets. Use release artifact checksums and preferably provenance/attestations where supported. Never place production signing secrets in ordinary CI. Clearly separate **build**, **sign**, **publish**, and **promote** steps.

### Release artifacts

- Web: static deploy artifact and optionally versioned ZIP.
- Android: debug APK in CI; signed AAB for Play production; optional signed APK for direct testers.
- iOS: simulator app in CI; signed IPA for TestFlight/App Store when credentials and export configuration exist.
- Windows: NSIS installer, optional portable ZIP.
- macOS: DMG and ZIP, signed/notarized when configured.
- Linux: AppImage and DEB.
- Each artifact named with application, version, platform, architecture and channel; include SHA-256 checksums and release notes.

CI may build different targets on different operating systems. No workflow may label a build signed if it was not signed, or call a GitHub artifact a store deployment.

## 10. Distribution and release strategy

**Channels:** `dev`, `ci`, `beta`, `production`. Embed app version, native build number, commit SHA and channel in diagnostics (no secrets). Use semver for public versions; increment native build numbers monotonically per store requirements.

**Web:** merge validated changes to main → Pages deploy. Document how to roll back to a previous commit/build, and caching/service-worker implications.

**Android internal testing:** generate signed AAB → upload to Google Play internal testing (or closed testing) after setting up Play Console, app identity, signing, testers and privacy declarations. For small direct-device tests, optionally distribute a signed APK securely, explaining sideload warnings and update-signing continuity. Upload via a maintained publishing action/CLI only when configured; otherwise generate artifacts and precise manual instructions.

**iOS beta:** signed archive → App Store Connect → TestFlight internal/external testers, subject to Apple's account, review and eligibility requirements. Explain app registration, bundle ID, team, provisioning, privacy information, screenshots and export compliance as applicable.

**Production mobile:** Google Play production and Apple App Store release workflows must require approval and credentials; do not auto-submit on ordinary pushes. Provide staged rollout and rollback guidance (note that mobile store rollback generally means shipping a newer fixed version, not downgrading installed apps).

**Desktop:** signed/notarized GitHub Release assets where configured; document manual download/installation, OS security prompts, update feed and fallback manual updates. Desktop auto-update must verify trusted signed release artifacts; leave disabled until fully configured and tested.

**Versioning:** generate a changelog entry and release notes, validate package/native versions, tag `vX.Y.Z`, and ensure build artifacts are reproducibly associated with the commit. No secret values in logs.

## 11. Security and privacy

- Electron hardening described in §7; no remote Node execution, no arbitrary IPC, no permissive external navigation.
- Capacitor native bridge permissions only as needed; document rationale for every manifest permission and iOS usage description.
- Secure contexts and user gesture requirements for browser APIs; handle denied permissions without loops.
- No telemetry by default, no analytics SDK, no backend, no embedded private credentials.
- Validate all data crossing native bridges; use least-privilege access and sanitise any HTML insertion. Avoid `innerHTML` with untrusted strings.
- Dependency lockfile, automated audit, secret scanning guidance, least-privilege Actions permissions and protected release environments.
- Ensure release builds cannot include development URLs, debugging endpoints, devtools auto-open, permissive CSP, or development-only cleartext network exceptions.
- Document safe local network exposure of Vite and wireless ADB; no public network exposure.
- Publish a privacy-policy template and store privacy-data inventory; clearly mark as template requiring review before submission.

## 12. Testing requirements

**Unit (Vitest):** adapter selection, capability mapping, error normalization, config validation, release-channel safeguards, routing and state logic. Mock native bridges without pretending integration is verified.

**Browser E2E (Playwright):** initial render, navigation/back, theme persistence, responsive viewport, swipe via pointer/touch where supported, keyboard accessibility, unsupported-feature states, offline fallback, GitHub Pages subpath asset routing, and absence of fatal console errors.

**Electron:** launch packaged or test-build app, verify preload contract, native file-dialog/menu demo with mocks where appropriate, blocked external navigation, no Node globals in renderer, restrictive IPC validation, clean exit.

**Android:** emulator boot, install debug APK, launch, verify shared UI, basic interaction and native plugin smoke test where feasible; attach logs/screenshots on failure. Document separate physical-device wireless smoke test.

**iOS:** macOS simulator build/install/launch, shared UI navigation and at least one native-capability smoke test; capture logs/screenshots. Real iPhone and TestFlight verification are separate manual acceptance checks.

**Quality:** ESLint, Prettier, automated dependency checks, accessibility checks where feasible, and no secrets in tracked files. Prefer deterministic tests; avoid external service dependencies. Set realistic CI timeouts and cache emulator/toolchain dependencies where appropriate.

## 13. Branding and customisation

- Ship a polished placeholder app icon, splash source and consistent design tokens. Generate required icon sizes via a documented tool.
- One editable configuration source controls app name, short name, default colours, website/support links and version; bundle IDs are initialised through a guided setup/rename command with clear consequences.
- Provide `docs/customisation.md`: replacing the demo with an existing vanilla SPA, public asset paths, imports, route/base path, icon regeneration, bundle ID changes, platform metadata sync, store listing preparation.
- Keep generated files identifiable; never overwrite developer customisations without warning.

## 13A. Future CLI readiness — design now, implement later

**V1 goal:** Make the starter reproducible and template-friendly without creating a generator or migration CLI yet.

- Use `universal-app.config.json` (schema-validated, non-secret) as the single canonical source for display name, initial identifiers, URLs, theme, targets and version settings. Keep native identifiers stable after initialization unless a dedicated migration is explicitly approved.
- Record starter provenance in `.universal-app.json`: template name/version, schema version, generated-project identifier (non-secret), and applied migration IDs (initially empty). Never use this as a place for credentials.
- Establish file ownership boundaries and document them in `docs/template-and-upgrades.md`: `src/app/**` and client business logic are app-owned; `src/platform/**` and reusable scripts are starter-owned; native projects and package/workflow config are **shared or generated** and require review before upgrades. Do not assume any whole directory can safely be overwritten.
- Make initialization, branding, icon generation, platform metadata sync, environment checks, and credential onboarding idempotent Node scripts with programmatic interfaces where practical. Avoid logic trapped in interactive prompts.
- Avoid hard-coded starter name, GitHub owner, repository, developer account, app ID, LAN IP, or signing identity. Never couple core runtime APIs to the future CLI.
- Document a future three-part structure (runtime core, versioned starter template, create/update CLI) as an architectural option, **not** mandatory packages in V1.
- Future CLI milestone V2: `create-universal-app` generator with interactive/non-interactive modes, config validation, safe project creation, and dry-run output. V3: version-aware updater with backups, ownership-aware changes, migration manifests, dry-run, conflict reporting, explicit approval, and rollback. Never implement blind overwrite upgrades.

## 13B. Late-stage credentials, certificates, and signing onboarding

**Design principle:** A client can work on the app for an extended period without production signing credentials. Credential setup must be independently repeatable later, without recreating the project, changing app identity unexpectedly, or losing existing source changes.

- Separate **development readiness**, **local release signing readiness**, **CI release signing readiness**, and **store publishing readiness**. `credentials:status` and `doctor` must report each separately per platform with PASS/NEEDS_SETUP/BLOCKED and next actions. Absence of release credentials is not a V1 development failure.
- Implement `scripts/credentials/*.mjs` as V1 guided utilities, with clear `--help`, `--non-interactive` where practical, and safe validation; future CLI commands such as `universal-app credentials setup android|ios|windows|macos`, `credentials check`, and `credentials github sync` should be thin wrappers around these scripts.
- **Android:** Accept a client-provided upload keystore (`.jks`/`.keystore`), alias and passwords; validate file existence, keystore/alias where tooling permits, and certificate fingerprint; explain the difference between the upload key and Google Play App Signing key, and preserve continuity of upload key. Use protected local paths/environment variables, not committed Gradle properties. Do not silently generate or rotate production keys.
- **iOS:** Explain Apple Developer team membership, bundle identifier, signing certificates, provisioning profiles, automatic vs manual signing, and TestFlight/App Store Connect. On macOS, validate available signing identities and provisioning where feasible; CI onboarding must document secure handling of `.p12`, profiles, passwords and App Store Connect API credentials. Never assume a client can export a non-exportable private key or that all signing modes require the same artifacts.
- **macOS desktop:** Validate client-provided Developer ID Application signing identity and notarization credentials/permissions; distinguish signing from notarization and explain Apple account requirements.
- **Windows desktop:** Support a documented signing provider/certificate integration appropriate to the chosen packaging tool; validate provider prerequisites. Explain trust warnings for unsigned builds and do not promise that a certificate removes every warning.
- **Linux desktop:** Document package signing/distribution choices where relevant; do not invent a universal Linux signing requirement.
- **GitHub Actions:** Use protected environments (`beta`, `production`), least-privilege workflow permissions, required reviewers where appropriate, scoped secrets/variables, and explicit release gates. Generate a redacted manifest of **secret names and expected formats**, never values. Optional `credentials:github:sync` must require `gh` authentication and appropriate repository permissions, show target repo/environment and names to be written, require explicit confirmation, and not print or persist values. A manual GitHub UI setup path must always be documented.
- Use secure local storage or references to external files/OS credential stores when possible; if a local `.env` or properties file is necessary, create it with restrictive permissions where supported, ensure it is ignored by Git, and warn about backup/transfer risks. Do not put secrets in `universal-app.config.json`, `.universal-app.json`, CLI arguments (where process listings expose them), build logs, error output, or build artifacts.
- Do not copy sensitive keys into project source folders by default. Never upload private signing keys to GitHub without the user's explicit decision and a clear explanation of the implications. Prefer a dedicated credential provider where suitable.
- Require validation-only and dry-run paths, actionable missing-prerequisite messages, and tests proving no secret leakage. Do not claim signing succeeded until an actual signed artifact is built and its signature checked.
- Document recovery: lost Android upload key, expired/revoked Apple certificates, provisioning changes, rotated CI credentials, compromised secrets, and ownership handoff from developer to client. Make clear which identities/keys should be controlled by the client from the outset.

## 14. Documentation deliverables

Write plain English, with prerequisites, copyable commands, expected outcomes, failure modes and relevant screenshots/diagrams where practical. Every command shown must be real and tested where feasible.

| File | Required contents |
|---|---|
| `README.md` | Five-minute quick start, platform overview, prerequisites, command shortcuts, CI badges, documentation index |
| `AGENTS.md` | Persistent Codex rules and verification discipline |
| `docs/getting-started.md` | Clone, Node/npm, `npm ci`, first run |
| `docs/architecture.md` | Shared SPA, adapters, wrappers, data flow, capability contract |
| `docs/toolchain.md` | Exact tested versions and compatibility requirements |
| `docs/development.md` | Browser dev, hot reload, debugging, offline workflow |
| `docs/android-wireless.md` | USB-free pairing, ADB, APK install, LAN live reload, troubleshooting |
| `docs/android.md` | Android Studio, emulator, debug/release, permissions, Play prerequisites |
| `docs/ios.md` | Xcode, simulator, real iPhone, signing and device deployment |
| `docs/desktop.md` | Electron development, packaging, signing, notarization, installers |
| `docs/commands.md` | Complete npm script reference with flags and environment variables |
| `docs/github-actions.md` | Triggers, runners, artifacts, secrets, environments, Pages setup |
| `docs/testing.md` | Unit/E2E/native smoke tests, CI coverage and limitations |
| `docs/beta-testing.md` | Small-group distribution for all supported targets |
| `docs/store-publishing.md` | Play Console, App Store Connect, metadata, signing, submissions |
| `docs/releases-and-updates.md` | Versioning, release channels, rollback, desktop updates |
| `docs/customisation.md` | Rebranding, replacing SPA, identifiers, assets |
| `docs/template-and-upgrades.md` | Config/provenance schema, file ownership, future generator and safe updater design |
| `docs/credentials.md` | Late signing onboarding, platform-by-platform setup, local and GitHub secrets, validation, recovery, client ownership |
| `docs/security.md` | Threat model, bridge security, permissions, secrets, privacy |
| `docs/troubleshooting.md` | Common build, device, ADB, Xcode, signing and CI failures |
| `docs/known-limitations.md` | Missing credentials/hardware, unsupported capabilities, unverified steps |
| `docs/privacy-policy-template.md` | Clearly marked editable privacy policy template |

## 15. Repository and CI operational details

- Include `.gitignore` for local SDK paths, `.env*` secrets (with safe `.env.example`), build products, derived data, key material and generated logs.
- Commit native lock/config files needed for reproducible Android/iOS builds, but not local developer secrets.
- Include `LICENSE` (choose a permissive licence and document it), `CONTRIBUTING.md`, `CHANGELOG.md` and an example release checklist.
- Include repository issue/PR templates if useful, with CI verification checklist.
- Avoid introducing hosted services beyond GitHub Pages and GitHub Releases by default.
- Ensure default workflows are usable in a newly created GitHub repository after enabling Actions; explain any settings requiring human intervention.

## 16. Acceptance criteria — definition of done

A criterion is **PASS** only with evidence. Otherwise mark **BLOCKED** with reason, or **FAIL**. Codex must create a final verification table in its completion report.

### Shared app

- [ ] `npm ci`, `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e` succeed on a supported environment.
- [ ] SPA is genuinely vanilla JS; no second platform-specific UI implementation.
- [ ] Mobile and desktop use the same shared SPA bundle pipeline.
- [ ] Demo is visually polished and responsive on phone, tablet and desktop sizes; accessible via keyboard.
- [ ] Capability demonstrations correctly distinguish supported, denied and unavailable states.
- [ ] Core UI works offline in packaged apps.

### Web

- [ ] GitHub Pages build works under a non-root repository path.
- [ ] Pages workflow deploys successfully in a configured repository; if no repository access, report BLOCKED, not PASS.

### Android

- [ ] Android native project compiles into an installable debug APK.
- [ ] Android emulator installs/launches app and passes smoke tests.
- [ ] Wireless ADB pairing/install/live reload documented and scripts implemented.
- [ ] Real wireless phone deployment verified if device is available; otherwise BLOCKED.
- [ ] Release AAB generated and signed only if signing credentials exist; otherwise BLOCKED with instructions.

### iOS

- [ ] iOS project compiles and launches on simulator on macOS.
- [ ] iOS simulator smoke tests pass.
- [ ] Real iPhone and TestFlight deployment verified only with Apple access/device; otherwise BLOCKED.

### Desktop

- [ ] Electron dev mode runs with a working restricted preload bridge.
- [ ] Windows NSIS, macOS DMG, Linux AppImage and DEB artifacts generated on appropriate runners.
- [ ] Desktop smoke tests and IPC/navigation security tests pass.
- [ ] Signing, notarization and auto-update marked BLOCKED until configured and verified.

### Delivery

- [ ] All npm commands listed in §8 exist and work or fail with actionable prerequisites.
- [ ] Starter config and provenance metadata validate; app-owned files remain isolated from starter-owned files.
- [ ] Late signing onboarding works without recreating the project, and absence of credentials does not block unsigned development.
- [ ] Credential scripts redact secrets, support readiness checks and safe GitHub setup; no keys or certificates are committed.
- [ ] The future project-generation/update CLI is documented but **not implemented** in V1.
- [ ] All listed docs exist and accurately reflect the implementation.
- [ ] CI workflows use minimal permissions, isolate secrets and upload correctly named artifacts.
- [ ] No secret or development-only server URL is embedded in production output.
- [ ] Final report identifies tested tool versions, commands run, artifacts produced, remaining manual actions and limitations.

## 17. Required implementation phases

**Phase 0 — discovery and toolchain:** Inspect repository; select compatible stable versions; record decisions in `docs/toolchain.md`; create implementation checklist. Never delete existing work without approval.

**Phase 1 — shared SPA:** Build Vite app, themes, navigation, polished demo, browser adapter, unit tests, browser E2E and GitHub Pages subpath handling. Verify before continuing.

**Phase 2 — platform contract:** Implement capability model and normalized errors; adapter unit tests and fallback UI; isolate platform imports.

**Phase 3 — Android:** Add Capacitor Android, plugins, icons, APK build, emulator tests, wireless ADB scripts and LAN live reload. Verify production config excludes dev server.

**Phase 4 — iOS:** Add Capacitor iOS, plugins, icons, simulator build/tests, permissions and device/TestFlight docs. Use macOS where available; explicitly record blockers otherwise.

**Phase 5 — Electron:** Secure main/preload, native demonstrations, desktop smoke tests, Windows/macOS/Linux packages.

**Phase 6 — CI/CD:** Add workflows, artifact naming, Pages deployment, debug/simulator/desktop CI, protected beta and release pipelines; validate workflow syntax.

**Phase 7 — documentation and hardening:** Complete all docs, security review, rebranding flow, icon generation, release notes, future-CLI readiness/config/provenance/ownership rules, safe late-stage credential onboarding and validation utilities, failure-case tests and `npm run doctor`. **Do not implement the future CLI.**

**Phase 8 — final verification:** Execute all feasible checks; produce a concise PASS/FAIL/BLOCKED matrix with exact evidence and instructions for credentials/hardware-dependent steps. Fix failures rather than declaring completion.

### Reporting format after each phase

Summarise: files changed; architecture decisions; commands executed and actual results; generated artifacts; blocked items; next phase. Continue autonomously where safe. Do not publish, purchase services, create store listings, change repository security settings, or expose secrets without explicit user approval.

## 18. Final instruction

Optimise for a **maintainable, genuinely reusable template**, not the shortest demo. Prefer simple vanilla JS and explicit adapters to framework complexity. Ensure that a future developer can clone the repository, replace `src/` with their own vanilla SPA, and understand how to build, test, distribute and update each target without reverse-engineering the tooling.
