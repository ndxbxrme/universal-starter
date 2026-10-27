# Architecture

One HTML/CSS/JavaScript SPA is compiled by Vite. `dist/native` uses relative assets for both Capacitor and Electron; `dist/web` uses an explicit WEB_BASE for Pages. There is no second UI. Hash navigation works on static hosting and native asset servers.

App-owned `src/app`, `src/features` and the main view use `getPlatform()` only. Starter-owned `src/platform` selects a versioned preload bridge, then the official Capacitor runtime, then web. User-agent strings never grant privileges. OS-specific imports stay inside adapter modules.

The adapter has `id` (`web`, `android`, `ios`, `windows`, `macos`, `linux`), `channel` (`dev`, `ci`, `beta`, `production`), `device.getInfo()`, `capabilities.list()`, `notifications.show({title,body})`, `haptics.vibrate({durationMs})`, `clipboard.writeText(text)`, `files.pick({accept})`, `share.show({title,text})`, `network.getStatus()` and `network.subscribe(callback)`. All feature calls return promises. Subscribe returns an unsubscribe function. File results contain metadata, never native paths or content. Desktop file filtering is intentionally controlled by main, not renderer input.

Capabilities carry supported and permission (granted/denied/prompt/unavailable/unknown) plus optional reason. API availability is not proof of hardware or permission. Errors use UNSUPPORTED, PERMISSION_DENIED, CANCELLED, FAILED. Raw native errors are normalized before display to avoid sensitive paths or details. Permissions are requested only by user gestures. Local notifications do not require a push server.

Native wrappers bundle assets for offline launch. The browser keeps its loaded shell usable offline; reload caching is not implemented. No service worker is installed inside wrappers. Diagnostics omit unique device IDs; events are memory-only.
