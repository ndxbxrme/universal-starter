import { readFileSync } from "node:fs";
const config = JSON.parse(readFileSync("universal-app.config.json"));
const provenance = JSON.parse(readFileSync(".universal-app.json"));
console.log(
  "Native identity migration plan (no changes made):\n1. Commit a reviewed backup and decide whether existing store installations must keep the current identity. A new app ID creates a different store app; signing continuity cannot merge identities.\n2. Update canonical appId, Android namespace/applicationId, Java package declaration and source-directory path, Android test package, iOS PRODUCT_BUNDLE_IDENTIFIER (both configurations), and URL/provider references. Use Android Studio/Xcode rename/refactor tools; do not regenerate projects.\n3. Re-register matching client-owned store identifiers/profiles only after account-owner approval. Update test/install/CI configuration and entitlements if added.\n4. Review the full diff, then update initializedAppId in .universal-app.json to the reviewed appId. Run config:validate, config:sync, icons:generate, cap:sync, all builds and device upgrade/install tests. Old installed apps will not update across an ID change.\n5. Preserve the original signing keys and backup for existing installations. See docs/customisation.md.",
);
console.log(
  config.appId === provenance.initializedAppId
    ? "Current identity is stable; no migration requested."
    : "Canonical identity differs; config:sync is blocked until this reviewed migration is completed.",
);
