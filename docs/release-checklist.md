# Release checklist

- Review client-owned identity, public support/privacy URLs, audience/privacy declarations and licensing.
- Increment canonical version and independent native build numbers; update changelog and sync/review metadata.
- Run shared checks, real affected native builds/smoke tests, production URL guards and repository/secret checks.
- Validate client credential references, expiration/recovery contacts, signing continuity, actual signatures and macOS notarization separately.
- Commit reviewed source and run release:prepare; associate artifacts/checksums/notes with the matching commit/tag.
- Obtain owner approval before tags, protected dispatches, account/secret changes, draft promotion or store submission.
- Review all target installers/device paths and accept only explicitly documented blockers.
- Stage beta first, test upgrade/uninstall/offline/permissions, then approve staged production promotion.
- Preserve rollback/forward-fix artifacts and client-controlled recovery assets without copying private keys into the repo.
