# Work on the app day to day

Most screen changes can be made in the browser first. The phone and desktop apps use the same UI; their platform adapters provide the native features.

## Start a browser session

With Node 24 selected and dependencies installed, run:

```sh
npm run dev
```

Open **http://127.0.0.1:5173** and leave the terminal running. Saving a shared UI file should update the page automatically. Press **Ctrl+C** to stop. For a fresh checkout, follow [Getting started](getting-started.md) first.

Port 5173 must be available. Stop an earlier development server before starting `dev:android` or `dev:desktop`, which manage their own server session.

## Choose the right output

| Command             | Output        | Use it for                                       |
| ------------------- | ------------- | ------------------------------------------------ |
| `npm run build`     | `dist/native` | Bundled phone/desktop assets with relative paths |
| `npm run build:web` | `dist/web`    | Static website files                             |

For a Pages project site, supply the explicit `WEB_BASE=/repository-name/` setting as described in [GitHub Actions](github-actions.md). Native builds must not inherit that path. Hash routes keep navigation working on Pages without a server fallback.

## Test features in the right place

Browser APIs can differ from native phone APIs. Use the interaction buttons to request permissions; if denied, the result explains what happened. Change browser site permissions to retry. An unavailable API stays unsupported. A vibration API existing in a desktop browser does not mean the computer contains vibration hardware.

The new GPS, camera and audio demos are described in [Device showcase](device-showcase.md). Native/plugin changes need a rebuild and reinstall, even when JavaScript live reload works. Use [wireless Android](android-wireless.md), [iOS](ios.md) or [Desktop](desktop.md) for the target-specific loop.

## Understand what persists

The theme is stored locally. Session diagnostics remain in memory. The file-picker demo returns metadata without reading or uploading file contents. GPS and temporary audio/photo behavior have their own explicit controls; see the showcase guide before testing real personal data.

Once loaded, browser navigation can work without the network, but reloading the website offline is not promised because there is no service worker. Packaged apps bundle their screens and do not need a network connection to start.

## Compare the layout

The reference [desktop](images/home-desktop.png) and [phone](images/home-phone.png) images show browser layouts, not native-device acceptance. Check keyboard focus, touch targets, light/dark themes, reduced motion and small-screen overflow as you change screens. Run `npm run check` before handing over a change.
