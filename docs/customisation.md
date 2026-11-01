# Make the starter your app

Change the name, artwork and screens before preparing a public release. If an app is already published, keep its identity and signing continuity unless you have deliberately planned a different app. The [client account guide](client-start-here.md) can run alongside development; certificates do not need to come first.

## Set the public details

Edit `universal-app.config.json` for the display/short name, public HTTPS website/support URLs, theme colours, app version, native build numbers, targets and channel. Replace the placeholder `dev.example` and `example.com` values before publishing. Keep secrets out of this file; the schema rejects unknown fields and credentials in URLs.

Use a numeric app version such as `1.2.3`. Beta/dev status belongs in the channel rather than a marketing-version suffix. Android and iOS have their own monotonically increasing build numbers.

Check and preview changes before applying them:

```sh
npm run config:validate
npm run config:sync -- --dry-run
npm run config:sync
```

Review the resulting Git diff. These helpers synchronise known metadata; they do not approve a permanent identifier migration for you.

## Replace the demo screens

Keep the root `index.html` as Vite's entry point. Replace the demo modules in `src/main.js`, `src/app`, `src/features` and `src/styles` with your vanilla JavaScript app, or change the entry's script import to your existing module.

Keep native calls behind `src/platform`; feature views should not import Electron or Capacitor directly. Imported relative assets are bundled by Vite. Public assets should use `import.meta.env.BASE_URL`. Keep hash routing for Pages unless you have supplied and tested another server fallback.

`npm run build` creates native-safe assets. `npm run build:web` accepts a separate `WEB_BASE`. After changing screens, rerun keyboard/accessibility, offline, subpath and affected native smoke checks.

## Add your icon

Edit `resources/icon.svg`, the original MIT artwork master, then run:

```sh
npm run icons:generate
```

The generator creates web PNG/SVG, desktop ICO/ICNS, Android adaptive/legacy icons and splash images, and iOS icon/splash catalogs. Splash artwork uses the same master and configured dark background. Do not hand-edit generated outputs; change the source and regenerate instead. Review masks and safe areas on real launchers/devices. Run setup again when needed for other generated metadata/notices, and inspect the diff.

## Choose the permanent app identifier

The initial IDs are placeholders. Print the proposed migration first:

```sh
npm run identity:plan
```

The command explains affected fields and consequences without changing them. Back up or commit existing work, then perform a reviewed migration with the appropriate Studio/Xcode refactor tools. Update canonical/provenance `initializedAppId` only as part of that agreed change, sync and rebuild both platforms. Do not delete and regenerate wrappers as a naming shortcut.

Changing a published application's identifier creates a different store app and does not update its existing installations. If existing users must receive updates, preserve their app and signing identities. For a new client project, also choose a fresh provenance UUID as described in [Template ownership](template-and-upgrades.md).

## Review before release

Check the app name/icons, public support/privacy pages, identifier ownership, version/build numbers, licences, permission explanations, screenshots, audience ratings and actual data use with the client. Account/listing creation and publication need approval. Continue with [Credentials](credentials.md) and [Store publishing](store-publishing.md).
