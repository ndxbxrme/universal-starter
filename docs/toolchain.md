# Toolchain

Discovery: 2026-10-27, Linux x64. Existing files: AGENTS.md and CODEX_PROJECT_SPEC.md; no commits or implementation. Both supplied files are preserved.

Node **24.13.0**, npm **11.6.2** are installed and tested for dependency discovery. Node major 24 is pinned in `.nvmrc` and package engines. Dependencies use exact versions and the npm lockfile; CI uses `npm ci`.

Selected stable registry versions: Vite 8.3.5, Vitest 5.0.5, Playwright 1.64.1, ESLint 10.13.0, Prettier 3.9.10, Capacitor 8.5.3, Electron 45.1.0, electron-builder 26.18.0. Installed plugin versions and later verification results are recorded below as implementation progresses.

Compatibility references checked during discovery:

- [Vite guide](https://vite.dev/guide/): Node 20.19+ or 22.12+.
- [Capacitor environment](https://capacitorjs.com/docs/getting-started/environment-setup): Node 22+, macOS/Xcode 26+ for iOS; Swift Package Manager is the default.
- [Capacitor 8 migration](https://capacitorjs.com/docs/updating/8-0): iOS 15+, Android API 24 minimum, compile/target API 36, Android Studio Otter or newer. Generated 8.5 native templates take precedence if requirements increased.
- [Electron stable releases](https://releases.electronjs.org/?channel=stable), verified against npm registry dist-tags.

Initial blockers: Java, Android SDK/ADB, Gradle, Xvfb absent from PATH. No macOS/Xcode, Windows host, physical devices, production signing credentials or store accounts have been supplied. No external publication is authorized. Missing release credentials do not block unsigned development.

Capacitor plugins pinned/tested for sync: app 8.1.2, clipboard 8.0.1, device 8.0.3, haptics 8.0.2, local-notifications 8.3.1, network 8.0.1, share 8.0.3. Sharp 0.35.5 generates original icons. The generated Android project uses Gradle 8.14.3, API 24/36/36. xcode's transitive uuid is overridden to 11.1.1 (last CommonJS-compatible patched major) to remediate GHSA-w5hq-g745-h8pq; xcode uses only uuid.v4. Android/iOS project generation/sync is rechecked with this override. No forced dependency downgrade was applied.

After user authorization, local tools installed outside the repository under `$HOME/.local/share/universal-toolchain`: Temurin JDK 21.0.13+9, Android command-line tools 15859902 (verified published SHA-256), API 36 revision 2, build-tools 36.0.0, platform-tools/ADB 37.0.1 (ADB protocol version 1.0.41). For this machine, source `$HOME/.local/share/universal-toolchain/env.sh` before native commands. This is a local environment convenience, not a portable project requirement. No production keys were generated. Android SDK licenses were accepted as part of the authorized installation.

Additional installed/tested tooling: Capacitor iOS 8.5.3 (generation/sync only on Linux), Ajv 8.20.0, yaml 2.9.1, @axe-core/playwright 4.14.0, Maestro CLI 2.12.0 (ZIP checksum verified; runtime smoke blocked by emulator), Android Emulator 37.2.12, API 34 Google APIs x86_64 image revision 14, AGP 8.13.0, Gradle 8.14.3, Kotlin 2.0.21 and AGP-selected build-tools 35.0.0. actionlint 1.7.12 was downloaded from its official release and checksum verified. Exact GitHub Action SHA/version pairs are in action-pins.json; hosted runner labels were checked against actions/runner-images (Ubuntu 24.04 x64, Windows 2025 x64, macOS 26 arm64). Remote jobs remain unexecuted.

The host lacks /dev/kvm. Two software CPU models boot-looped with boringssl-self-check-failed; all emulator processes were stopped. Android APK/AAB compilation is proven separately. Linux Electron tests require the existing trusted root-owned Chrome sandbox helper through CHROME_DEVEL_SANDBOX on this Ubuntu AppArmor policy. No sandbox restriction was disabled on the user's host.

31 October 2026 device-showcase additions: Geolocation 8.2.4, Camera 8.2.6, Browser 8.0.5 and ScreenOrientation 8.0.2, exact npm pins compatible with Capacitor core >=8 (current tested core remains 8.5.3). License notices regenerated. Native Android plugins compiled; iOS SPM sync and custom resource/source registration validated without claiming Mac compilation. A fresh full npm audit now reports 20 moderate build-tool dependency findings, rooted in glob/minimatch advisories published since the earlier zero-advisory record. Runtime-only audit (`npm audit --omit=dev --audit-level=moderate`) passes with zero findings. Forced npm “fix” proposes incompatible major downgrades; no such changes were applied. Compatibility remediation/upstream releases for tooling remain outstanding; full audit/CI security gate is currently FAIL and is not hidden or weakened.
