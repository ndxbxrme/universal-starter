# Prepare a release and plan updates

Use this page once the client has approved a tested build and its signing arrangement. Ordinary development does not publish anything. The [release checklist](release-checklist.md) helps keep approval and verification together.

## Choose version and build numbers

Canonical app version is stable numeric semver X.Y.Z. Android versionCode and iOS build number are independent positive integers; increase monotonically for existing store apps. Channels dev/ci/beta/production are embedded with commit SHA and both native build numbers. Only beta/production may be signed. Template provenance version remains independent of the client app version.

## Prepare without publishing

Update config and CHANGELOG.md, sync/review metadata, run check/native verification and commit the source. `npm run release:prepare` validates schemas, canonical/native/package versions, public identity/support URLs, changelog, clean Git and server safeguards; it writes artifacts/release-notes.md without publishing. It deliberately fails on template IDs/URLs. `npm run release` validates the same prerequisites and prints the protected workflow path; it does not push tags, create accounts or publish.

## Build through the protected workflow

After explicit client approval, create/push the matching reviewed vX.Y.Z tag and manually dispatch the protected beta/release workflow on it. Configure environments/runners first (github-actions.md). It builds, verifies actual signatures where applicable, stages checksums/notes, and optionally creates a production draft release. Linux uses checksums and does not claim a universal signature. No store submission is automatic. Review artifacts, platform/architecture/channel names, signatures and source association before promoting a draft or uploading to stores.

## Collect artifacts and checksums

`npm run artifacts -- android`, `-- ios`, `-- desktop` or `-- web` stages known build outputs only into artifacts/staging, with SHA256SUMS and notes. APP_CHANNEL controls names; RELEASE_BUILD=1 chooses release AAB/IPA instead of debug/simulator output. Output directories are generated/replaceable, not credential storage. Preserve final accepted artifacts externally according to the client's retention policy.

## Recover from a bad release

Web rollback redeploys a prior reviewed commit; Pages configuration/base must stay consistent. There is no service worker to invalidate. Mobile rollback usually needs a newer fixed version. Desktop updates remain manual; a future updater must verify trusted signed feeds/artifacts, handle interrupted/failed updates and be tested with downgrade/recovery cases before enabling. No automatic updater is installed or enabled in V1.
