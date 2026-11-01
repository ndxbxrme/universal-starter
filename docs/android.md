# Build and test the Android app

You can build Android on Linux, Windows or macOS. Begin with a development APK; Play signing can wait. If a client is opening a store account, send [Google Play setup](client-google-play.md). For a phone without USB, follow [wireless Android setup](android-wireless.md).

## Install the tools

Use Android Studio Otter 2025.2.1 or newer, **JDK 21**, **Android SDK API 36**, build-tools 36 and platform-tools. Set `JAVA_HOME` and `ANDROID_HOME`, and put the SDK's `platform-tools` directory on PATH so the terminal can find `adb`. See [the tested toolchain](toolchain.md) for exact versions and local setup history.

```sh
npm run doctor
adb version
```

The app's minimum Android API is 24 (Android 7). Wireless pairing without USB needs Android 11+. The committed Gradle wrapper downloads Gradle 8.14.3, so a separate global Gradle installation is not required.

## Make a development build

```sh
npm run build:android
```

This builds the shared UI, syncs the native project and runs Gradle's debug build. Expected output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Gradle signs it with the development key, so it can be installed for testing without a production keystore. `npm run android:open` opens Android Studio. Any new native plugin, manifest change or native source change needs a rebuild and reinstall.

For device selection, installation and live reload, continue with [wireless setup](android-wireless.md). A normal APK bundles its screens and does not need Vite to be running.

## Test an emulator

Create and start an API 36 emulator in Android Studio, then check that it appears as an authorised device:

```sh
adb devices -l
```

Install [Maestro](https://docs.maestro.dev/getting-started/installing-maestro), then run:

```sh
npm run test:android
```

The test builds, installs, launches, checks shared navigation and calls the real Device plugin. Results/screenshots go to `artifacts/android-smoke`; logcat is printed for CI capture. Emulator behavior is not proof of physical GPS, microphone, haptics or wireless pairing.

## Build a release bundle

First agree the permanent application ID and signing arrangement with the client. Placeholder IDs must be migrated before publication; see [Customisation](customisation.md). [Credentials](credentials.md) explains upload-key ownership and validation.

```sh
npm run build:android:release
```

Expected output: `android/app/build/outputs/bundle/release/app-release.aab`.

Without configured credentials, this is explicitly **unsigned** and cannot go to Play. With the approved `ANDROID_KEYSTORE_PATH`, `ANDROID_KEY_ALIAS`, `ANDROID_STORE_PASSWORD` and `ANDROID_KEY_PASSWORD` inputs, Gradle signs the beta/production build. Never put these secrets into Gradle source files or command-line arguments.

Check the actual signature before handing it over:

```sh
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

Then follow [Store publishing](store-publishing.md) for Play App Signing, listing/privacy tasks, tester setup and approval. An AAB is a store upload, not a directly installable APK.

## Permissions used by this app

| Permission or feature      | Why it is present                                                                |
| -------------------------- | -------------------------------------------------------------------------------- |
| Internet / network state   | Network status and development networking                                        |
| Vibration                  | Haptics demo                                                                     |
| Notifications              | User-requested local notifications, including the Android 13+ prompt             |
| Boot-completed / wake lock | Notification plugin restores schedules and delivers them while the device sleeps |
| Coarse/fine location       | Foreground GPS demo; approximate location is accepted                            |
| Record audio               | Explicitly requested microphone recording                                        |

The exact-alarm permission is removed; notification schedules are inexact. There is no background-location, app-camera or broad-storage permission. Camera/photos use system intents/pickers; the file picker grants access to the chosen file. Denied notifications can be changed in Android Settings.

Back follows shared navigation; Back from Home exits. Release builds block cleartext networking and backups. The [device showcase](device-showcase.md) explains temporary audio, photo previews, GPS cleanup and native preferences. Android's optional “Additional settings in the app” link depends on the phone's Settings implementation.

## Notes for small development machines

Gradle is limited to two workers and Kotlin runs in the Gradle process to reduce memory pressure. AGP 8.13.0 may install build-tools 35.0.0 even with API/build-tools 36 available. An SDK XML-version warning by itself is not a build failure; read the final Gradle result. See [Troubleshooting](troubleshooting.md) if tools or the emulator fail.
