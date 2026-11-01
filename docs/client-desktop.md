# Getting Windows and Mac downloads ready for customers

**For:** the app owner, with the developer or IT administrator. This guide covers apps downloaded directly, rather than mobile app-store accounts. You can leave signing until later while testing development builds.

A signature lets the computer check the publisher and whether a file has changed. It does not promise that every operating-system warning disappears.

## Windows: choose a supported signing arrangement first

This starter creates an EXE installer. Its existing signing path selects a certificate and accessible private key through the Windows certificate store/provider. Ask the developer to confirm compatibility **before purchasing a certificate or service**. A website's HTTPS certificate is not an app code-signing certificate.

Microsoft describes certificate-authority and managed signing options in [code signing for Windows apps](https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options). Modern public code-signing keys may be held in hardware or a provider service rather than supplied as an exportable `.pfx` file. This starter does not currently implement Azure Artifact Signing's separate integration. Do not buy that service expecting the current certificate-thumbprint configuration to work unchanged.

1. Tell the developer your business's legal name, where it is registered and where you will distribute the installer.
2. Ask them to propose a provider, expected cost, verification requirements and a compatible signing machine/provider setup.
3. Approve the provider and purchase only after that review. Follow the provider's identity verification directly.
4. Arrange access to the key through the provider's supported method. If a physical token is involved, agree who holds it and how it is used for builds. Do not assume it can be copied for backup.
5. The developer validates access, signs a test installer and checks its signature on Windows. Review that result before approving a public release.

**Finished when:** a real signed installer identifies the expected publisher and its signature validates. A certificate order confirmation or thumbprint alone does not establish this. Windows reputation/SmartScreen warnings can still occur. [Microsoft's comparison](https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options) explains the distinction.

## Mac: use the client's Apple Developer team

For a Mac app downloaded outside the Mac App Store, the developer needs **Developer ID Application** signing and **notarization**. Notarization sends the signed software to Apple for automated checks. It is separate from signing and from an App Store review. Apple's [Developer ID guide](https://developer.apple.com/help/account/certificates/create-developer-id-certificates) and [notarization guide](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution) describe these steps.

1. Complete [Apple account setup](client-apple.md) if the business has no active membership. The same ordinary Apple Developer membership can support iOS and Mac work.
2. Tell the developer this is a direct-download Mac app. An iOS distribution certificate is not a substitute for Developer ID Application.
3. Agree the Mac that will hold the private key and the business's recovery arrangement.
4. For a locally managed Developer ID certificate, the Account Holder follows **Apple Developer → Certificates, Identifiers & Profiles → Certificates → + → Developer ID Application**, using the certificate request supplied by the Mac operator. Check the exact certificate type before confirming. Cloud-managed arrangements have different permissions and must be agreed separately.
5. The Mac operator installs the returned certificate alongside the matching private key. They configure an approved notarization credential in the Mac's Keychain; the project refers to that saved profile by name.
6. Approve the notarization upload. Ask the developer to verify the signature, notarization ticket and Gatekeeper result, then try the installer on a separate Mac.

**Finished when:** the actual package is signed with the intended identity, notarization succeeds and the installation test passes. Downloading a `.cer` alone cannot complete signing because the private key is also needed. [Apple's identity export explanation](https://developer.apple.com/documentation/xcode/sharing-your-teams-signing-certificates) covers that distinction.

You can own the account without owning a Mac. You will still need an agreed Mac operator or build service to perform and verify these steps. This starter's protected signing workflows expect client-controlled signing runners; a hosted alternative needs a separate setup review.

## Linux and website downloads

There is no single Linux signing certificate to buy for every distribution. Agree the target distributions and download channel with the developer. The starter supplies AppImage and DEB files with SHA-256 checksums; a managed package repository can add its own signing policy. A website deployment does not need a mobile or desktop app-signing key.

## What to send back

Use the [handover worksheet](client-handover.md) to record the provider/team, account owner, renewal dates and who operates the signing machine. Send your developer public identity details or confirmation of access. Transfer private material only through the agreed secure route, and never put it in the worksheet.

Public provider/Apple instructions checked **1 November 2026**. Windows and Mac signing have not been exercised on this Linux documentation-review host. The developer-facing [credential instructions](credentials.md) list the exact configuration supported by this repository.
