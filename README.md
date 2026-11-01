# Universal Starter

Build one app for the web, Android, iPhone, Windows, Mac and Linux. The screens use ordinary HTML, CSS and JavaScript; Capacitor connects them to phones, and Electron provides the desktop app. You can start in a browser and add the native tools when you need them.

[![CI: remote run pending](docs/images/ci-status.svg)](.github/workflows/ci.yml)

The badge is a local status image. It will not show live CI results until you configure this repository on GitHub.

## Try it locally

Install **Node 24**, open a terminal in this project folder, then run:

```sh
npm ci
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173**. You should see the Home screen with navigation to Capabilities, Interactions, Diagnostics and Settings. Keep the terminal running while you work; press **Ctrl+C** to stop it. You do not need signing certificates or store accounts for this first run.

If this is your first checkout, [Getting started](docs/getting-started.md) explains the commands and what to install next. See the app's [desktop](docs/images/home-desktop.png) and [phone](docs/images/home-phone.png) previews.

## Try the device features

The [device showcase](docs/device-showcase.md) includes GPS, a carousel that follows your finger, native preferences, camera/photos, audio recording and other small device demos. Open **Interactions** to try them. The app explains when an API is unavailable or permission has been denied.

Native changes require rebuilding and reinstalling the phone app. Browser tests cannot confirm a physical microphone or GPS receiver works. See the [showcase verification report](docs/device-showcase-verification.md) and [original implementation report](docs/verification.md) for what actually ran.

## Choose your next step

| You want to…                                                | Follow this guide                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Give a client clear account-setup instructions              | **[Client: start here](docs/client-start-here.md)**                                 |
| Set up an Android phone without USB                         | [Wireless Android development](docs/android-wireless.md)                            |
| Build for Android                                           | [Android](docs/android.md)                                                          |
| Understand iPhone development without owning Apple hardware | [iOS](docs/ios.md) and [client Apple setup](docs/client-apple.md)                   |
| Run or package a desktop app                                | [Desktop](docs/desktop.md)                                                          |
| Change the app's name, icon or screens                      | [Customisation](docs/customisation.md)                                              |
| Put the website on GitHub Pages                             | [GitHub Actions and Pages](docs/github-actions.md)                                  |
| Prepare signing and release builds                          | [Credentials](docs/credentials.md) and [store publishing](docs/store-publishing.md) |

## Common commands

| Command                 | What you get                                | What else you need                            |
| ----------------------- | ------------------------------------------- | --------------------------------------------- |
| `npm run build:web`     | Website files in `dist/web`                 | Node/npm; configure the base path for Pages   |
| `npm run build:android` | Installable development APK                 | JDK 21 and Android API 36 SDK                 |
| `npm run build:ios`     | iOS simulator app                           | A Mac with Xcode 26+                          |
| `npm run dev:desktop`   | Desktop app with live reload                | Electron's host OS prerequisites              |
| `npm run build:desktop` | Installer/package for this computer's OS    | The matching host and packaging prerequisites |
| `npm run doctor`        | A report of missing tools and signing setup | No production credentials required            |

For automated checks, first run `npx playwright install chromium`, then `npm run check`. The [command reference](docs/commands.md) lists every script and its options. Exact tested versions are in [Toolchain](docs/toolchain.md).

## Preparing a client app

The template includes placeholder names and identifiers. Follow [Customisation](docs/customisation.md) before preparing a public release; changing an already-published app's identifier creates a different app. Clients keep ownership of their accounts and signing keys. They can arrange signing later without starting the project again.

The app has one shared vanilla JavaScript UI, with no UI framework, TypeScript or backend. Core packaged screens work offline. Automatic desktop updates stay disabled until trusted signed updates have been configured and tested. The future project-generator/updater CLI is documented, not implemented.

Code and original artwork use MIT. Runtime dependency notices are included in Settings and `resources/THIRD_PARTY_NOTICES.txt`. Documentation links to third-party screenshots identify their original source.

## More documentation

- Build and develop: [development](docs/development.md), [architecture and platform API](docs/architecture.md), [template ownership and upgrades](docs/template-and-upgrades.md).
- Test and release: [testing](docs/testing.md), [beta testing](docs/beta-testing.md), [releases and updates](docs/releases-and-updates.md), [release checklist](docs/release-checklist.md).
- Client handover: [Apple](docs/client-apple.md), [Google Play](docs/client-google-play.md), [desktop signing](docs/client-desktop.md), [ownership worksheet](docs/client-handover.md).
- Resolve problems: [troubleshooting](docs/troubleshooting.md), [known limitations](docs/known-limitations.md), [security](docs/security.md), [privacy policy template](docs/privacy-policy-template.md).
