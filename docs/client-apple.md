# Apple: set up your business account for an iPhone app

**For:** the business owner or authorised member of staff. **You can do the account work in a web browser.** You do not need Xcode or a Mac to open the account and invite your developer (steps 1–5). Someone on the development team will need access to a Mac to build and sign the app, and an iPhone or iPad is needed for physical-device testing.

Your goal here is an active Apple Developer membership and a working invitation for your developer. Certificates come after that, with your developer's help.

## 1. Check whether your business already has an account

Ask whoever looks after your existing apps or IT accounts. If the business already has Apple Developer membership, use that team and skip to step 4. If another agency holds the app, tell your developer before starting a second account; an app transfer or access change may be needed.

Apple uses two websites:

| Website                                                 | What it is for                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Apple Developer](https://developer.apple.com/account/) | Membership, team identity and app signing resources                      |
| [App Store Connect](https://appstoreconnect.apple.com/) | App listings, TestFlight testing, store submissions and team invitations |

Your **Apple Account** is the sign-in you use to reach them. It is not itself a paid developer membership.

## 2. Choose the right membership

A legally incorporated business publishing its own app will usually apply as an **Organisation**. Apple checks the legal entity and shows its legal name as the seller. A sole trader applies as an **Individual**; the person's legal name is shown as seller. Confirm this choice with your business before enrolling. Apple lists an annual fee of **US$99**, with local pricing shown during enrolment. Choose the ordinary **Apple Developer Program** for an App Store app. [Apple's membership requirements](https://developer.apple.com/help/account/membership/program-enrollment).

An organisation needs its legal details, D‑U‑N‑S number, a functioning business website, a work email on its domain and someone authorised to accept agreements. Look up an existing number or request one through [Apple's D‑U‑N‑S guidance](https://developer.apple.com/support/D-U-N-S/). Enter the legal entity name rather than a trading name. If the records differ, resolve that before applying.

## 3. Apply and wait for confirmation

1. The person responsible for the membership uses their own Apple Account. If they need one, open [account.apple.com](https://account.apple.com/), choose **Create Your Apple Account**, enter their details and verify the email address and phone number. [Apple's illustrated web sign-up guide](https://support.apple.com/en-gb/108647?device-type=web) shows the screen. Then open [Apple Developer enrolment](https://developer.apple.com/programs/enroll/).
2. If two-factor authentication is not already enabled, sign in at [account.apple.com](https://account.apple.com/) and follow **Upgrade Account Security** when offered. Keep access to the trusted phone number and recovery method. [Apple's two-factor guide](https://support.apple.com/en-gb/102660) includes the web route. If the account cannot complete it, use Apple's help rather than sharing another person's sign-in.
3. Choose the agreed entity type and enter the requested business or personal details. Review the displayed seller identity carefully.
4. Follow Apple's verification emails. Organisation applications may require further evidence of legal authority or business identity.
5. After approval, accept the agreement and arrange membership payment. Save the receipt and renewal details in the business records.

**Finished when:** [your developer account](https://developer.apple.com/account/) shows active membership. A created Apple Account or payment receipt on its own does not confirm every account check is complete. Use [Apple Developer support](https://developer.apple.com/contact/) if the application stalls; keep the enrolment reference handy. The [official enrolment guide](https://developer.apple.com/help/account/membership/program-enrollment) describes Apple's verification and payment sequence.

## 4. Invite your developer

Ask your developer for the exact email address they use for their Apple Account and which app they need to access.

1. Sign in to [App Store Connect](https://appstoreconnect.apple.com/) as the Account Holder or an authorised administrator.
2. Open **Users and Access**, then **People**. Use the **+** button to add a user.
3. Enter the developer's name and confirmed email address.
4. For someone who will build and upload the app, start with the **Developer** role. Agree separately if they also need App Manager duties such as managing the listing or submission. Give access to the relevant app where the interface allows it.
5. For an organisation team, enable **Access to Certificates, Identifiers & Profiles** if they will manage signing. Read the scope before confirming: this resource access is broader than access to a single app's listing. Avoid granting Admin merely to bypass a permissions error.
6. Send the invitation. Ask the developer to accept it and confirm they can see the correct team and signing resources.

**Finished when:** the developer can access both the app resources they need and the intended team. [Apple's invitation instructions](https://developer.apple.com/help/app-store-connect/manage-your-team/add-and-edit-users) and [role descriptions](https://developer.apple.com/help/account/access/roles/) explain the permissions.

**If you registered as an Individual:** an App Store Connect invitation does not add the developer to your Apple Developer signing team. Pause and agree the signing arrangement with them. Do not send your Apple Account password as a workaround. This difference is described in [Apple's account overview](https://developer.apple.com/help/app-store-connect/manage-your-team/overview-of-accounts-and-roles).

## 5. Send the team details back

Open [Apple Developer](https://developer.apple.com/account/) and choose **Membership details**. Copy the team name and the **Team ID**, a ten-character identifier. This is safe to send to your developer; it is not a password. [Where Apple shows the Team ID](https://developer.apple.com/help/glossary/team-id/).

Your developer should give you the app's agreed **Bundle ID**, for example `uk.co.yourbusiness.propertyapp`. It is a permanent technical name, not the name customers see. Ask them to register it on your team and prepare the App Store Connect app record. Confirm the business name and intended app before authorising this work. Never use this starter's placeholder identifier.

If you are doing the registration yourself, follow [register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id), entering the exact Bundle ID supplied by your developer. Then follow [add an app record](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app), selecting that same ID. Ask the developer for the language, SKU and access choices rather than guessing. Both operations can also be handled by a suitably authorised developer.

**You can pause here** once membership is active, the invitation works and you have sent the completion note below. The next two sections explain signing files and optional automation; only act on them when your developer requests a specific arrangement.

## 6. Let your developer arrange signing

You do not need to download a collection of certificate files before inviting the developer. Ask them which signing method they will use and where the private key will be held. [Apple's signing workflow](https://help.apple.com/xcode/mac/current/en.lproj/dev60b6fbbc7.html) describes Xcode's automatic management.

| Item you may hear about                            | What it does                                                     | What you should do                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Apple Development / Apple Distribution certificate | Identifies the team for development or distribution signing      | Let the developer configure the agreed certificate on the Mac; keep an ownership/recovery record |
| Provisioning profile (`.mobileprovision`)          | Connects the app, team and allowed signing/distribution settings | Developer arranges it for the selected build method                                              |
| Certificate download (`.cer`)                      | Contains the public certificate                                  | It does **not** include the private key and cannot sign an app by itself                         |
| Signing identity export (`.p12`)                   | Can contain a certificate and its private key                    | Transfer only when required, with encryption and a separate password channel                     |
| App Store Connect API key (`.p8`)                  | Allows specified automated operations against Apple's services   | Optional; see the next step before creating one                                                  |

If your developer needs an exportable `.p12`, the person with that identity on their Mac can use **Xcode → Settings → Accounts → team → Manage Certificates**, then Control-click the certificate and choose **Export Certificate**. Save with a strong password. [Apple's illustrated export guide](https://developer.apple.com/documentation/xcode/sharing-your-teams-signing-certificates) shows the real screens. Cloud-managed or non-exportable identities may not offer this option; agree another supported signing arrangement instead of replacing an existing certificate.

## 7. Only create an API key if one is requested

This starter does not require a `.p8` key for ordinary development or its current manual store-upload path. Before creating one, ask which tool needs it, what permissions it needs, who will hold it and how it will be revoked.

If an agreed integration needs a **team** API key, the Account Holder first requests API access in **App Store Connect → Users and Access → Integrations**. Once approved, an Account Holder or Admin can use **Team Keys → Generate API Key**, name it and choose the agreed role. Download the private key once and store it securely. Record its Key ID and Issuer ID separately from the private file. [Apple shows where to find those identifiers](https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests). Team keys can reach all apps at their assigned role; they cannot be limited to just this app. [Apple's API-key instructions](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api).

Stop if the download is lost or the wrong permissions were selected. Ask the developer to agree revocation/replacement; an existing key cannot simply be downloaded again. Never paste a `.p8` file into the app's source or a support message.

## 8. Know what happens next

Your developer builds on a Mac, checks signing and uploads an approved build. You can review its progress in App Store Connect. For testing, they arrange a **TestFlight** invitation; testers install Apple's TestFlight app and accept the invitation. External testing may require Apple's review, and builds expire after 90 days. [Apple's TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

Membership and a successful upload do not publish the app automatically. Agree the listing, privacy answers, test results and release date before approving submission. Your developer's [iOS guide](ios.md) covers build work; [store publishing](store-publishing.md) covers the release sequence.

## Send this completion note to your developer

- Membership status and team name:
- Team ID:
- Organisation or Individual membership:
- Invitation sent to / accepted:
- Agreed Bundle ID, if already chosen:
- Existing app link, if there is one:
- Any outstanding verification or agreement message:

Include no passwords, sign-in codes or private files. If you need help, a screenshot of the error with personal information hidden is usually enough to start.

Screen names and public instructions checked on **1 November 2026**. We have not signed in to your account or verified these steps on a Mac. The linked Apple help includes official screenshots where available; this guide does not present invented account screens as screenshots.
