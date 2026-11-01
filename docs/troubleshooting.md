# When something does not work

Start with the symptom below. Keep the command and final error message so someone else can reproduce the problem. Hide secrets, personal information and local client files before sharing logs. Client account questions have separate [Apple](client-apple.md) and [Google Play](client-google-play.md) walkthroughs.

## Dependencies will not install

Use Node 24 and run `npm ci` with the committed lockfile. Check network/proxy access if downloads fail. Do not force major dependency upgrades to solve a native SDK error; that can introduce unrelated incompatibilities. [Toolchain](toolchain.md) records the tested versions, while `npm run deps:check` and `npm run security:audit` report dependency status.

If formatting changes after managed-file updates, review the generated diff and use `npm run config:sync` or the formatter for the affected files. Avoid overwriting unrelated user edits.

## The development page will not open

| Symptom                                  | What to check                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Port 5173 already in use                 | Stop the earlier Vite session before starting another web, desktop or Android live-reload helper                    |
| Browser API unavailable or denied        | Use localhost/HTTPS, click the action button and check site permissions; some browsers lack the API                 |
| Pages assets return 404                  | Rebuild with the correct `WEB_BASE` for the repository; do not change native build paths                            |
| Website fails to reload offline          | There is no service worker; offline website reload is not promised                                                  |
| Android live app says connection refused | Keep the helper running; check the computer's current LAN address, selected port and phone-to-computer reachability |

Follow [wireless Android troubleshooting](android-wireless.md) for the full connection sequence. Browser compilation alone does not establish that the phone can reach Vite.

## Android build or wireless connection fails

Run `npm run doctor`. Check `JAVA_HOME`, `ANDROID_HOME` and that `adb` is on PATH. Accept the SDK licences through your SDK manager. AGP can install build-tools 35 even when API/build-tools 36 are present; an SDK XML-version warning alone is not a failed build. Read the final Gradle result.

Wireless debugging uses separate pairing and connection ports, which can change. Verify `adb devices -l` and pass the first-column serial when selecting a device. Check VPNs, firewall rules and guest-Wi-Fi/client isolation. [Wireless setup](android-wireless.md) covers reconnection and restoring the offline app after live reload.

On a small machine, avoid running multiple emulator/build jobs together. The project limits Gradle workers and Kotlin processes. If `/dev/kvm` is absent, Linux emulator acceleration is unavailable. The original host's software emulator boot-looped with `boringssl-self-check-failed`; use an accelerated runner or real phone instead of treating compilation as a runtime pass.

## Xcode cannot resolve packages or build the app

Use a Mac with Xcode 26+, finish its first-launch setup, install a simulator runtime and run `npm ci` before resolving Swift packages. Check `xcode-select -p` points to the intended Xcode. A Linux machine can sync assets but cannot compile iOS.

The release build phase also needs Node on PATH. Xcode launched from the desktop may not inherit nvm settings; supply `NODE_BINARY` through the build environment or run the documented npm command from a correctly configured terminal. Do not add a remote production server URL as a workaround for missing bundled assets.

For signing errors, check team, Bundle ID, certificate **and private key**, provisioning profile and export method together. Do not delete/recreate the native project or revoke a certificate at random. See [iOS](ios.md) and [credential recovery](credentials.md#when-something-is-lost-or-expires).

## The desktop app will not launch or install

On Linux, Electron needs a display and a working sandbox policy/helper. Use Xvfb for headless tests where appropriate. Do not disable the production sandbox to silence an error. The original Ubuntu host uses its existing trusted Chrome sandbox helper through `CHROME_DEVEL_SANDBOX`; do not make an arbitrary download setuid.

AppImage mounting may require FUSE; the AppImage's `--appimage-extract-and-run` mode is an alternative where supported. Review DEB dependencies on the intended distribution. Windows and Mac packages still need testing on those operating systems.

If a native feature fails, check OS permission and hardware availability. An API being present does not prove a microphone or notification permission is available. Cold Electron startup can also take longer on slower hosts. [Desktop guide](desktop.md).

## Credential setup or CI access fails

Run the platform setup command with `--help`, then check its external absolute paths and environment inputs. Sensitive tool errors are deliberately suppressed; inspect the path, alias, password and provider in the client's controlled environment without printing secrets. Missing release credentials do not block unsigned development.

GitHub secret sync requires an existing protected environment, repository admin access and exact confirmation of the target. Check the account plan can enforce the intended approval rules. Do not enable release workflows just to bypass a missing protection.

For an expired profile/certificate, lost upload key or ownership change, follow [Credentials](credentials.md#when-something-is-lost-or-expires). An artifact download is not evidence of successful signing, store access or publication.
