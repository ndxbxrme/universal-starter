# Share a test build with a small group

Start with a handful of testers and one clearly identified build. Tell them what to try, how to report problems and whether the app contains real or test data. Keep signing keys and account credentials away from testers; they only need an installation route.

Before sharing, agree the version/build number, test audience, privacy wording and release notes with the client. Run the relevant checks and use the beta channel for a signed beta. Protected CI uses the `beta` environment; a downloaded CI artifact is not automatically a store release.

## Pick an installation route

| Platform                   | Usual route                                             | What the tester receives                          |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Android through Play       | Play internal or closed testing                         | An opt-in link and Play installation instructions |
| Android direct device test | An approved installable APK or development install      | The APK/instructions; sideload prompts may appear |
| iPhone/iPad                | TestFlight                                              | An invitation plus Apple's TestFlight app         |
| Desktop                    | Reviewed installer for the tester's OS and architecture | Installer, release notes and checksum             |
| Web                        | Reviewed website deployment                             | The actual website address                        |

## Android

For a Play test, the client completes [account setup](client-google-play.md), grants the agreed access and arranges the upload key. The developer builds/verifies a signed AAB, prepares the testing track, uploads it and configures tester access. Follow [Store publishing](store-publishing.md) for that sequence. An AAB cannot be installed directly by tapping the file.

A debug APK is useful for developer/device acceptance but is not the production signing arrangement. A direct signed beta APK needs an agreed key and update continuity. Tell testers about sideload prompts and distribute through a trusted route. The starter's normal release helper produces an AAB; a direct signed APK needs an explicitly reviewed Studio/Gradle build.

For personal accounts subject to Google's closed-test eligibility rules, an internal test does not replace the qualifying closed test. [Google's current requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).

## iPhone and iPad

Use [Apple setup](client-apple.md), then a signed build uploaded by the Mac operator to App Store Connect. Complete its TestFlight processing and requested beta information before inviting testers. External testers may need a reviewed beta build. Testers install TestFlight and accept the invitation; an ordinary tester does not need to buy developer membership. [Apple's TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

A simulator `.app` is not an iPhone installation file. Development/ad-hoc deployment is a different route with its own device/profile requirements; ask the Mac operator to arrange it deliberately. Test on at least one physical device before treating simulator behavior as device acceptance.

## Desktop

Build for the tester's OS and architecture. Windows signing and Mac Developer ID plus notarization help establish publisher identity; unsigned builds can trigger warnings. Do not tell testers to disable their security protections as a routine installation step. Agree any unsigned internal test in advance.

Try installation, launch, offline screens, microphone permission/playback, window resizing, uninstall and an update from the previous beta. Linux AppImage/DEB compatibility needs testing on the intended distributions. Updates remain manual until a trusted updater is configured and verified.

## Web

Enable and deploy a reviewed [GitHub Pages build](github-actions.md), then share the URL from the deployment result. Test asset loading under the real repository path, navigation/back, touch and keyboard use. This starter has no service worker, so do not promise an offline reload of the website. A rollback redeploys the previous reviewed commit.

## A short message you can send testers

> Please try version [version/build] on [device/platform]. Install it using [approved link or instructions]. We would like you to check [three specific tasks]. Send problems to [support contact], with your device model, OS version, app version and what you were doing. Please hide personal information in screenshots and do not send passwords or private files. This is a test build, so [state any limits or data rules].

Replace every bracketed item before sending. For the new showcase, useful tasks include permission denial/recovery, GPS outdoors, dragging the carousel, recording/playback/discard, and opening native preferences. Do not ask for client/customer data just to test a demo.

Review feedback with the client, record unresolved issues and obtain approval before moving to production. Keep browser, simulator, physical-device and account/signing results distinct in the verification record.
