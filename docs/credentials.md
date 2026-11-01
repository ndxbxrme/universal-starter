# Configure signing for a client app

This page is for the developer or build administrator. For instructions you can send straight to a client, use [Client: start here](client-start-here.md), then the [Apple](client-apple.md), [Google Play](client-google-play.md) or [desktop](client-desktop.md) walkthrough. The client should not need to understand environment variables to open an account.

You can build and test unsigned development versions first. Add production signing when the client has chosen their app identity, arranged account access and approved how private keys will be held. None of the utilities below creates, rotates, imports or uploads a production key for you.

## Check which stage is ready

Run these read-only reports from the project root:

```sh
npm run credentials:status
npm run doctor
npm run credentials:status -- --verify-artifacts
```

The reports separate development, local signing, CI signing and publication. The last command invokes available signature checks on current artifacts. Missing or unsigned artifacts remain `NEEDS_SETUP`; environment variables alone do not prove signing works. macOS notarization is checked separately. Store approval and publication are separate from all of these build checks.

## Agree ownership before moving files

The client owns the accounts and signing assets. Agree recovery contacts, authorised users, backup locations and the signing machine/provider with them. Keep private files outside the checkout, with OS access controls and encrypted backups. Use [the handover worksheet](client-handover.md) for public details and custody records; never fill it with secret values.

## How the setup utilities work

Each `credentials:setup:*` command validates the inputs for its platform. Use `--help` for its options.

| Option                  | What it does                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Default interactive run | Prompts for missing inputs; secret prompts do not echo characters                                    |
| `--non-interactive`     | Requires inputs from the environment or saved references                                             |
| `--dry-run`             | Checks that inputs are present; does not perform cryptographic checks or write files                 |
| `--save-references`     | After validation, saves only paths/public identifiers outside the repo; never saves passwords/tokens |

Saved references live under `~/.config/universal-app/credentials`, scoped by project UUID and app ID. Set `UNIVERSAL_CREDENTIALS_FILE` to use another external location. POSIX files use mode 600; on Windows also review user-only NTFS permissions. Do not copy references blindly between clients or machines.

Build helpers load saved references, but passwords still come from the process environment or the OS/provider's credential store. An environment variable is not an encrypted vault.

## Supply passwords without putting them in shell history

Never put passwords in command-line arguments, project config, Gradle properties, logs or artifacts. Turn off shell tracing before handling them. For a Bash signing session, hidden prompts can populate environment variables:

```sh
read -rsp 'Keystore password: ' ANDROID_STORE_PASSWORD
export ANDROID_STORE_PASSWORD
read -rsp 'Key password: ' ANDROID_KEY_PASSWORD
export ANDROID_KEY_PASSWORD
```

The typed characters are deliberately invisible. In PowerShell, use `Read-Host -AsSecureString` with your approved credential provider rather than literal passwords. Prefer an OS/provider secret store for long-term custody, and clear password variables after the session.

## Android: validate the existing upload keystore

Ask for the approved keystore location, alias and secure access to its passwords. If a new app needs its first key, agree creation and custody with the client first; see [Google Play setup](client-google-play.md). If an app already exists, establish continuity before creating anything.

Set these inputs in the signing environment:

| Input                    | Meaning                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `ANDROID_KEYSTORE_PATH`  | Absolute path to the client's external `.jks` or `.keystore` file |
| `ANDROID_KEY_ALIAS`      | Name of the upload key inside it                                  |
| `ANDROID_STORE_PASSWORD` | Password for the keystore                                         |
| `ANDROID_KEY_PASSWORD`   | Password for the key                                              |

Then validate without saving, or add the optional reference flag:

```sh
npm run credentials:setup:android -- --non-interactive
npm run credentials:setup:android -- --non-interactive --save-references
```

The utility exports only the public certificate through keytool, checks its dates/RSA size, and prints the public SHA-256 fingerprint and expiry. The private-key password is proven only when a real signed build succeeds.

```sh
npm run build:android:release
npm run credentials:status -- --verify-artifacts
```

With configured signing inputs and a beta/production channel, the release helper signs the AAB. Without them it explicitly produces an **unsigned AAB**, which cannot be uploaded as a Play release. Preserve upload-key continuity. The upload key and Google's Play App Signing key serve different jobs; see [Google's signing explanation](https://developer.android.com/studio/publish/app-signing).

## iOS: validate signing on the Mac

Complete [Apple account setup](client-apple.md), confirm the intended team/Bundle ID and agree automatic versus manual signing. On macOS, run:

```sh
npm run credentials:setup:ios
```

`APPLE_TEAM_ID` is required. Optional `IOS_PROVISIONING_PROFILE` points to an external profile. `IOS_EXPORT_OPTIONS` points to an external, reviewed export-options plist and is required by the release helper. The setup utility checks matching valid Keychain identities, optional profile team/expiry and plist syntax. It does not create or install certificates or profiles.

A downloaded `.cer` without the matching private key cannot sign. A password-protected `.p12` is needed only when transferring an exportable identity; use the client's approved Keychain workflow and secure transfer. Automatic/cloud-managed signing and non-exportable keys may use a different arrangement. Do not assume every client can supply the same files.

Once the Mac's signing configuration and export method are ready:

```sh
npm run build:ios:release
npm run credentials:status -- --verify-artifacts
```

Verify a certificate-backed signature, then test the selected iPhone/TestFlight distribution path. The helper does not upload to Apple. See [iOS](ios.md) and [Store publishing](store-publishing.md).

## macOS desktop: signing and notarization are separate

Use `CSC_NAME` to select the client's **Developer ID Application** identity already in Keychain. Validate it with:

```sh
npm run credentials:setup:macos
```

Set `DESKTOP_SIGN=1` to enable signing for a beta/production build. Notarization is an additional approved upload to Apple: set `DESKTOP_NOTARIZE=1` and `APPLE_KEYCHAIN_PROFILE` to an existing notarytool profile, with optional `APPLE_KEYCHAIN` for an external keychain path.

To create the profile interactively, the authorised Mac operator runs `xcrun notarytool store-credentials PROFILE_NAME` and follows its prompts, omitting password arguments. Use the agreed credential type and permissions; the setup utility can perform a read-only history check through that profile. No raw Apple password or `.p8` contents are forwarded as subprocess arguments.

Verify codesign, the stapled notarization ticket and Gatekeeper assessment on the resulting app. Protected production workflows require both signing and notarization. These operations require a Mac and account access; none was verified on this Linux host. [Client desktop guide](client-desktop.md).

## Windows: validate provider/private-key access

Choose a provider compatible with the existing Windows certificate-store signing path before purchase. The client imports an exportable certificate through Windows Certificate Import Wizard or configures the supported CSP/KSP/provider. Do not assume a hardware/provider key can be exported.

Set `WINDOWS_CERTIFICATE_SHA1` to the public certificate thumbprint in `CurrentUser/My`, then run:

```sh
npm run credentials:setup:windows
```

It checks certificate existence, private-key access and expiry. Optional `CSC_LINK` and `CSC_KEY_PASSWORD` validate an external PFX through OpenSSL with an environment password; this optional validation requires OpenSSL. Actual packaging uses the OS certificate store/provider and SHA-256 signing, not password arguments to SignTool.

Enable `DESKTOP_SIGN=1` for an approved beta/production build. Verify the installer with `Get-AuthenticodeSignature` and test it on Windows. Provider support must be proven by an actual signed build. Signing does not guarantee no SmartScreen/reputation warnings. The current path does not implement Azure Artifact Signing as a separate service integration.

## Linux and web

Linux has no universal desktop signing identity. Use the generated SHA-256 checksums and the client's chosen package/repository signing policy. Do not label an unsigned AppImage or DEB as signed. A Pages website does not need an application signing key.

## Set up CI only after local signing works

The current protected workflows expect isolated client-controlled signing runners. They keep keystores/profiles outside the checkout and certificates in OS stores or approved providers. Never run untrusted pull requests on signing runners. Keep access restricted and collect only allowlisted artifacts.

For each of `beta` and `production`, the repository owner should approve the environment protections, reviewers, tag restrictions and runner arrangement. A hosted-runner alternative requires a separate review of temporary Keychain/P12/profile handling, permissions, transport and cleanup; it is not configured automatically by this starter.

Preview the required names without authenticating or writing secrets:

```sh
npm run credentials:github:plan -- --repo client/project --environment beta
npm run credentials:github:sync -- --repo client/project --environment beta --dry-run
```

Replace `client/project` with the agreed repository. The manifest lists names/formats, not values. For manual setup, the authorised owner opens **repository Settings → Environments → beta or production**, adds the named environment secrets/variables and configures the agreed protections. Do not paste signing files into text fields. Set `RELEASE_ENABLED=true` only after runner validation and approval.

The optional sync utility uploads only the selected Android password/alias secrets; it rejects private certificate/key-file uploads. An actual write requires authenticated `gh` with repository admin permission, an existing protected environment, selected environment inputs and explicit confirmation of the exact repository/environment. `--names` limits the selection. `--non-interactive` also requires `--confirm OWNER/REPO/ENVIRONMENT` matching the intended target. Values go to `gh` through stdin, not arguments or temporary files; partial failures report written names only. No secret sync has been performed as part of documentation work.

See [GitHub Actions](github-actions.md) for workflow behavior. Platform plan/features can affect available environment protection rules; confirm they can enforce the intended approval policy before enabling releases.

## When something is lost or expires

| Problem                           | First action                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Lost Android upload key           | Ask the Play Console owner to follow Google's upload-key reset process. This does not recover or replace Google's app-signing key. |
| Expired/revoked Apple certificate | Review the team identity and affected provisioning profiles, renew through the client team and revalidate the archive.             |
| Wrong Apple profile/entitlements  | Check team, Bundle ID, certificate, profile and distribution method together.                                                      |
| Exposed CI password/token         | Revoke or rotate it at the provider, update protected environments, remove runner copies and review audit logs before rebuilding.  |
| Departing maintainer              | Transfer account/runner custody and recovery access, then revoke their access.                                                     |

Record public fingerprints, expiry dates, store IDs, owners and backup locations. Keep private values out of the repo. Never generate a replacement production identity just to make a failing build pass. Use [the handover worksheet](client-handover.md) to keep responsibilities clear.
