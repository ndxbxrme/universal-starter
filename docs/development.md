# Development

Use Node 24. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173. Expected: Home with a platform badge and sidebar; edits hot reload. Ctrl+C stops the server.

`npm run build` produces `dist/native` with relative assets for wrappers. `npm run build:web` produces `dist/web`; set `WEB_BASE=/repository-name/` for a Pages project site. Never pass a Pages base to native builds. Hash routes preserve browser history without a server fallback.

Theme is stored locally. Session diagnostics stay in memory; file content is not read or uploaded. Offline navigation works after loading the browser app; web reload while offline is not promised (no service worker). Packaged apps bundle the UI and do not need a network to start.

Browser permissions are requested by interaction buttons. Denial is reported; change it using browser site settings. Unsupported APIs are disabled. A desktop browser’s vibration API can exist without physical vibration hardware, so browser support is only an API availability claim.

Reference views from the local implementation: [desktop](images/home-desktop.png) and [phone](images/home-phone.png). These are browser screenshots, not evidence of a native device run.
