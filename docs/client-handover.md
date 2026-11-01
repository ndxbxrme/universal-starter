# App accounts and release handover

Keep a completed copy in your business records. Ask your developer to help fill it in before the first public release, then update it when responsibilities change. **Record where secrets are kept, never the secrets themselves.**

## People and ownership

| Detail                                     | Your answer |
| ------------------------------------------ | ----------- |
| App/business name                          |             |
| Business account owner                     |             |
| Backup contact if the owner is unavailable |             |
| Developer's name and invited email         |             |
| Person who approves test releases          |             |
| Person who approves public releases        |             |
| Support contact for app users              |             |

## Store and app details

| Detail                                             | Your answer |
| -------------------------------------------------- | ----------- |
| Apple team name and Team ID                        |             |
| Apple membership renewal date / responsible person |             |
| Apple Bundle ID and App Store listing link         |             |
| Google Play account owner and account type         |             |
| Android package name and Play listing link         |             |
| Windows signing provider / renewal date            |             |
| Mac Developer ID identity / expiry                 |             |
| Source repository owner and location               |             |
| Website/support/privacy-policy addresses           |             |

Team IDs, package names and certificate fingerprints are public identifiers. Passwords, recovery codes, private keys and certificate exports are not.

## Recovery arrangements

| Question                                                                           | Record the responsible person and location, not the contents |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Where are account recovery instructions held?                                      |                                                              |
| Where is the Android upload keystore backed up?                                    |                                                              |
| Who can access the keystore passwords?                                             |                                                              |
| Where is the Apple signing private key held? Is it exportable or provider-managed? |                                                              |
| How would an authorised replacement developer obtain signing access?               |                                                              |
| Who controls signing machines, hardware tokens and provider access?                |                                                              |
| Which optional API keys exist, who owns them and what can they access?             |                                                              |
| Who receives certificate/membership expiry reminders?                              |                                                              |

Ask the developer to verify the backup or recovery route with you. A certificate download without its private key is not a signing backup. Some provider-held keys cannot be exported; record the provider's recovery procedure instead.

## Before approving publication

- [ ] I can access the business's store accounts and recovery methods.
- [ ] The developer confirmed the app identity and signing identity match the intended app.
- [ ] I tried the agreed build on the intended devices, or recorded exactly what is still untested.
- [ ] I approved the app title, screenshots, support details and privacy information.
- [ ] I know the release date, audience and who will monitor problems.
- [ ] We agreed the cost of memberships, signing services and build hosting.
- [ ] I understand that a successful build or upload is separate from store approval and public release.

Approved version/build and date:

Outstanding items and who accepted them:

## When a developer or employee leaves

Arrange replacement access and recovery custody first. Review store invitations, source-repository access, signing runners and provider permissions. Remove the departing person's access when the handover is complete. Ask the remaining maintainer whether any credentials need revocation or replacement; changing an app's production key casually can break future updates.

For a lost Android upload key, start with the Play Console owner and Google's upload-key recovery process. For an Apple certificate/profile problem, ask the team maintainer to review the affected identity and profiles before renewing or revoking anything. The technical [recovery guide](credentials.md#when-something-is-lost-or-expires) explains what to check.
