# Take a tested app to the stores

This is a developer-and-client checklist for the first release. If the client has not opened their accounts yet, start with [the client guide](client-start-here.md). Signing, uploading, store approval and public release are separate stages; agree who is responsible for each.

No account registration, store upload or publication has been performed by this documentation work. The starter's placeholder identifiers and support URLs must be replaced before release.

## Before either mobile store

The developer and client should agree:

- The permanent app identity, customer-facing name and client-owned store account.
- The tested build/version, target devices and any outstanding issues.
- Store text, icons, real app screenshots, support address and a working privacy-policy URL.
- Audience/age-rating answers, actual data use, third-party services and permission explanations.
- Who can upload tests, who can submit for review and who approves publication.

Use the [privacy template](privacy-policy-template.md) as a draft, not a ready-made declaration for a different app. GPS, audio and client-added services need an accurate data-flow review. A signed build does not establish privacy compliance.

## Google Play: test first, then approve production

1. The client completes [Play account setup](client-google-play.md), verification and developer access. Confirm the application ID against any existing listing.
2. The developer validates the existing upload key, increments `versionCode` and builds a signed AAB. Check the actual signature/fingerprint and intended release channel. [Credential setup](credentials.md).
3. In Play Console, select the app and complete the dashboard's required setup tasks. Review listing, content rating, audience, data safety, privacy and any account-specific declarations with the client. [Google's app setup guide](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en).
4. Open the agreed testing track, prepare a release and upload the signed AAB. Review Play App Signing choices with the account owner, especially for an existing app. Add release notes and resolve processing errors before rollout. [Google's release instructions](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en).
5. Configure testers and share the track's opt-in instructions. Confirm they can install and update the intended build. Personal-account production eligibility can require a qualifying closed test; internal testing alone does not fulfil it. [Current testing rule](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
6. After testing, obtain client approval for the specific production build and release plan. Resolve the console's remaining review/access requirements before requesting production rollout.

**Complete when:** the intended track is available to its intended audience and someone has installed the store-delivered build. An uploaded AAB, a CI download or a green build alone does not prove that.

The workflow builds artifacts; it does not automatically submit or promote Play releases. Do not publish a new app just to replace a signing or account-access problem.

## Apple: arrange signing, then TestFlight, then App Review

1. The client completes [Apple account setup](client-apple.md). The Mac operator confirms team access, Bundle ID, signing/private-key access and the matching App Store Connect record.
2. Review any agreements shown to the Account Holder. Complete the app's listing, screenshots, age rating, privacy and export-compliance information using the actual finished product. [Apple's app-record guide](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app).
3. On the Mac, increment the build number, archive/export using the agreed distribution settings and verify the signature. Test on hardware as well as the simulator. A simulator `.app` is not an uploadable iPhone build. [iOS build guide](ios.md).
4. Use Xcode Organizer or another supported upload tool such as Transporter to upload the approved build. Wait for processing and resolve any reported issues. [Apple's upload guide](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).
5. In the app's **TestFlight** area, complete the requested beta information, select the build and arrange the agreed internal or external tester group. External testing may require review; testers use the TestFlight app. [Apple's TestFlight guide](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
6. Review feedback and obtain client approval for submission. Select the intended build for the store version, complete the review information and choose the agreed release method. Submit through App Store Connect and monitor review messages. [Apple's submission guide](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app).

**Complete when:** the intended version has Apple's approval, has been released by the agreed method and can be installed by its intended audience. Uploading a build or accepting a TestFlight invitation does not make it public in the App Store.

Our Mac/device/account-dependent parts remain unverified until someone with that access carries them out. Keep those results separate from static project checks.

## Desktop downloads

The current desktop packages are for direct distribution, not automatic Microsoft Store or Mac App Store submission. Follow [client desktop signing](client-desktop.md) before arranging identities or provider purchases.

The developer verifies the Windows installer's signature, or Mac Developer ID signature plus notarization/Gatekeeper result, on the actual package. Test installation, permissions and an upgrade from the previous version. For Linux, agree the target distributions and package/repository signing policy.

After approval, publish only the reviewed installers with release notes and checksums. A draft GitHub Release remains private to the permitted repository audience until someone publishes it. Auto-updates are disabled; tell users how to get future installers.

## If a release has a problem

Halt an active staged rollout where the store permits it, assess who is affected and prepare a fixed build. Mobile recovery usually means a **newer** version/build, rather than downgrading installed apps. Preserve source association, accepted artifacts, public fingerprints and release notes. Coordinate key/certificate recovery through [Credentials](credentials.md#when-something-is-lost-or-expires), not a fresh identity chosen as a shortcut.

Official store routes checked **1 November 2026**. Stores can add account-specific tasks and change labels; their current dashboard is the authority for what remains incomplete. Publication always needs the client's approval.
