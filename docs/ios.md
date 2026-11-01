# Build and test the iPhone app

You can edit the shared app on Linux or Windows. **Compiling, signing and running the iOS simulator require a Mac with Xcode.** Having an Apple Developer account does not remove that requirement.

For client account setup, send [the Apple walkthrough](client-apple.md). This page is for the developer operating the Mac. The iOS project is included, but compilation and physical-device testing have not been verified on this Linux host.

## Understand the three stages

| Stage               | What you can do                              | What you need                                                                   |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| Browser development | Edit and test the shared UI                  | Node 24; any supported development OS                                           |
| iOS simulator       | Run an iOS build on a simulated device       | Mac, Xcode and an installed simulator runtime; no production certificate needed |
| iPhone/TestFlight   | Test on hardware or distribute through Apple | Appropriate team/signing setup; physical device or TestFlight access            |

A simulator `.app` cannot be installed on an iPhone. A signed archive is still separate from a store submission.

If you do not own a Mac, arrange access to a suitable Mac or a build service before promising iOS delivery. The ordinary simulator CI workflow uses a macOS runner; the protected signing workflows in this starter expect client-controlled signing runners. Hosted signing needs its own reviewed credential arrangement. See [GitHub Actions](github-actions.md).

## Prepare the Mac

Install Xcode 26+ and complete its first-launch setup. Install an iOS simulator runtime through Xcode's settings if none is available. The app's minimum deployment target is iOS 15; this is different from the Xcode version needed to build it.

Use Node 24 and run this from the project root:

```sh
npm ci
npm run doctor
npm run dev:ios
```

The final command builds the shared UI, syncs the native project and opens Xcode. Capacitor 8.5.3 uses Swift Package Manager and plugin packages from `node_modules`, so install npm dependencies before asking Xcode to resolve them.

## Run a simulator

In Xcode, select the **App** scheme and an installed iPhone simulator as the run destination, then press **Run**. You should see the same Home screen as the browser app. The command uses bundled assets; it does not point the app at a LAN server.

For a command-line simulator build:

```sh
npm run build:ios
```

Expected output: `artifacts/ios/Build/Products/Debug-iphonesimulator/App.app`.

To choose a specific simulator, find its UDID and pass it to the build or test command:

```sh
xcrun simctl list devices available
npm run build:ios -- --device UDID
```

Replace `UDID` with the identifier shown by `simctl`. `npm run ios:open` opens the existing Xcode project without first rebuilding shared assets.

## Run the simulator smoke test

Install Maestro as described in [Testing](testing.md). Boot your chosen simulator, then run:

```sh
xcrun simctl boot UDID
npm run test:ios -- --device UDID
```

The test builds, installs, launches, navigates and calls the real Device plugin. Logs and screenshots go to `artifacts/ios-smoke`. A simulator pass does not verify a physical microphone, GPS accuracy, haptics, signing or TestFlight.

## Run on an iPhone

Use the client's agreed development team. In Xcode, open the app target's **Signing & Capabilities**, confirm its Bundle ID and select the team. Connect/select the phone, follow trust prompts and enable Developer Mode when the device requests it. Do not rename or recreate the app to clear a signing error.

Wireless use depends on Xcode/device pairing and reachability. An initial cable connection may be needed. Check **Window → Devices and Simulators** and the network connection options offered by your Xcode/device version; USB-free first pairing is not guaranteed. [Apple's signing workflow](https://help.apple.com/xcode/mac/current/en.lproj/dev60b6fbbc7.html) explains team and provisioning setup.

Try GPS, recording/playback, permissions, native Settings round trips, camera cancellation and background interruption on real hardware. The [device showcase guide](device-showcase.md) lists the cases that a simulator cannot establish.

## Prepare a signed release

First agree the client's signing method and register the matching app identity. Automatic Xcode signing and manual certificate/profile management use different arrangements; neither means the client should send you their Apple Account password. See [Credentials](credentials.md).

The scripted export expects `APPLE_TEAM_ID`, an existing usable signing identity/private key, appropriate provisioning, and `IOS_EXPORT_OPTIONS` pointing to a reviewed external `ExportOptions.plist`. Have Xcode generate/review export options for the selected distribution method rather than copying a generic plist without checking it.

```sh
npm run credentials:setup:ios
npm run build:ios:release
```

The build archives to `artifacts/App.xcarchive` and exports to `artifacts/ios-release`. The helper does not create/import production keys, automatically register devices or upload to App Store Connect. Verify the actual signature and distribution method before using Xcode Organizer or Transporter for an approved upload. Follow [Store publishing](store-publishing.md) for the remaining steps.

## Permissions and privacy

The current showcase has purpose strings for foreground location, microphone, camera, photo-library and motion use. Notifications and device features are requested by explicit user actions; it does not enable background location or audio recording. Files use the system picker. No unique device ID is requested.

The custom native preferences bridge uses the same UserDefaults as `Settings.bundle`. The app's privacy manifest declares the required UserDefaults reason. Capacitor/plugins supply their own manifests too. Review the **whole app**, its SDKs, purpose strings and data flows before completing App Store privacy answers; adding client services can change them. Local notification timing depends on the OS, and denial needs recovery through Settings.

Shared navigation, safe areas and reduced motion are supported. Native swipe-back behavior depends on the WebView and OS.

## If Xcode gets stuck

For package resolution, check `npm ci` completed, `xcode-select -p` selects the intended Xcode, a simulator runtime is installed and the Mac can reach the required Swift package sources. Do not delete/recreate the native project to fix it. Commit the Xcode-generated `Package.resolved` after the first successful Mac resolution; none was fabricated on Linux.

Release builds run `scripts/check-native.mjs` from an Xcode build phase to reject development URLs, unsafe CSP and Pages assets. Node must be on the build environment's PATH, or `NODE_BINARY` must point to it. Xcode launched from the desktop may not inherit your terminal's Node version-manager settings. Environment dumping is disabled in this phase to avoid leaking credentials.

If signing fails, check team, Bundle ID, certificate/private-key access, profile and export method together. Use [credential recovery](credentials.md#when-something-is-lost-or-expires) rather than revoking identities at random. Static plist/project checks on Linux are not evidence that Swift or this build phase compiled on macOS.
