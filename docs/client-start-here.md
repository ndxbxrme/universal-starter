# Getting your app ready for the app stores

This guide is for the person who owns the app or represents the business. You do not need to write code. Your part is to set up the business accounts, invite your developer and approve what is published. Your developer handles building the app and connecting the signing tools.

You can start this work while the app is still being built. Account verification can take time, so it is useful to begin before you have a launch date.

## Choose the guide you need

| Where will people get the app? | Start here                                         | What you need to arrange                                                     |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| App Store on iPhone or iPad    | [Apple account setup](client-apple.md)             | Apple Developer membership and an invitation for your developer              |
| Google Play on Android         | [Google Play account setup](client-google-play.md) | A verified Play Console account and an invitation for your developer         |
| Download for Windows or Mac    | [Desktop signing](client-desktop.md)               | Agree a signing provider or Apple signing arrangement before buying anything |
| A website link                 | Ask your developer for the website address         | No mobile app-store membership or app-signing certificate is needed          |

If you want both iPhone and Android apps, complete both mobile guides. These are separate accounts even though the app looks the same on both phones.

## Before you start

Choose someone in your business who will remain responsible for the accounts. They should be able to accept agreements, arrange payment and recover access if a member of staff leaves. Use an account they can keep access to; avoid an agency's account or a temporary employee's email address.

Have these details ready:

- Your legal business name and address, matching your official business records.
- Your business website, a work email address and a phone number you can answer.
- The name and email address your developer wants you to invite. Ask them to confirm this in writing.
- A payment method for the platform's registration or membership fee.
- Your D‑U‑N‑S number if registering an organisation. This is a business identifier from Dun & Bradstreet; it is different from a UK company registration number. Each platform guide explains where it is used.

An existing app needs particular care. Tell your developer where it is already published and who currently controls it before creating accounts, certificates or keys. Keeping the existing app identity lets customers receive updates.

## What does “signing” mean?

Signing puts a verifiable publisher identity on a build of your app. It helps the store or operating system check who supplied it. It is separate from creating an account, paying a fee or approving an app for sale.

A **private key** is the secret that makes that signature possible. A **certificate** describes the identity associated with a key. Some files contain both; those files need to be kept private. An **API key** lets software access a service and has a different job. You do not need to collect every kind of key mentioned on the internet.

For this starter's GPS demo, there is no maps-service account or GPS API key to obtain. Location permission comes from the phone. Opening the location in Google Maps uses a normal link. A future embedded map or paid service may need its own setup, which your developer should explain separately.

## How to work with your developer

1. Complete the account guide for each store you plan to use.
2. Invite the developer using the store's team settings. They sign in with their own account.
3. Send back the short completion checklist at the end of the guide. It asks for account details and confirmation, not your password.
4. Your developer prepares a test build and tells you how to install it.
5. Try the app, agree any changes, then explicitly approve the release when you are happy.

Keep your password, sign-in codes and recovery codes to yourself. If a private signing file needs to move between people, agree an encrypted transfer method first and send its password through a separate channel. Do not attach secrets to support tickets, project issues or ordinary group messages.

## Keep an ownership record

Use [the handover worksheet](client-handover.md) to record who owns each account, when membership renews and where recovery material is held. It contains no space for secret values. Keep the completed copy in your business records.

The screen names in these guides were checked against official help on **1 November 2026**. A store may change its layout or ask for extra verification. Each guide includes official links and explains what to do if your screen differs. Account registration, payment and publication are actions for you to approve and perform; this documentation has not performed them for you.
