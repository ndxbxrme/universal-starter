# Device showcase

Open **Interactions** for GPS, finger-following carousel, audio notes, camera/photos, battery, language, orientation, a motion sample, app lifecycle and the original clipboard/files/share/notification/haptics/network demos. Native app changes require rebuilding and reinstalling; JavaScript hot reload alone cannot register new plugins or manifest permissions.

## Location / GPS

Tap **Get my location** for a foreground snapshot, or **Follow location** for updates. Choose precise or approximate access in the OS prompt; approximate access is accepted. Each result shows latitude/longitude, reported accuracy and a timestamp. GPS is not guaranteed indoors, and reported accuracy is not a surveyed property boundary. Allow up to 20 seconds, enable device Location services and try outdoors if acquisition times out. Stop/clear controls are explicit; navigating away or backgrounding stops updates and clears displayed coordinates. No background location permission, background service, geofencing, reverse-geocoding service or server is implemented.

Coordinates remain in memory and are excluded from diagnostics/session logs. **Open this location in Google Maps** is an explicit transfer to Google Maps; no embedded map SDK, API key or automatic coordinate upload exists. Replace that provider as needed for a client product. Battery, sensors and position values are returned by real platform APIs; simulators/browser profiles do not establish physical GPS accuracy.

Browser location needs HTTPS or localhost and geolocation support. An ordinary HTTP LAN Vite page is not a secure browser context; the native app uses the native plugin even during LAN reload. Desktop Electron location is explicitly unsupported rather than requesting an unconfigured OS geolocation service.

## Native preferences inside system Settings

On iOS, **Settings → Apps → this app** (older iOS: **Settings → this app**) contains **Prefer high accuracy** and **Distance units**, supplied by the bundled Settings.bundle. The native bridge reads/writes the same UserDefaults keys. On Android, **Open native preferences** opens actual native controls using app-private SharedPreferences. The screen registers APPLICATION_PREFERENCES, so Android Settings implementations that support “Additional settings in the app” can link to it from app info. Android does not provide iOS-style custom preference panes embedded inside the system Settings process; the exported native screen is the supported integration, not a web imitation. Availability of that OS link varies by device.

The shared Settings screen edits the same preferences and has **Refresh preferences** after an external change. Browser/Electron preferences stay in local storage and native-settings buttons report unsupported. The high-accuracy preference is consulted on the next location request; the OS’s approximate-location choice always wins. Distance-unit preference is available to clients through the contract; the basic GPS accuracy readout deliberately remains metres. No credential or secret belongs in these preferences.

**Open app permissions in Settings** opens the OS app-info page for recovering denied GPS/microphone/camera permissions. It is separate from app preferences. App-specific iOS purpose strings must be rewritten to describe the actual client use before publication.

## Audio recording on web, mobile and desktop

Tap **Start recording**, approve microphone access, then **Stop recording**. The demo limits capture to 60 seconds and 8 MiB, displays the actual duration/size/type, and provides local playback, **Discard recording** and **Save / export recording**. Starting another recording discards the previous clip. Navigating away discards it; backgrounding interrupts an active recording. Playback is paused while the app is inactive. Nothing is automatically uploaded.

Android uses MediaRecorder and AAC/MPEG-4 (`.m4a`); iOS uses AVAudioRecorder with AAC/MPEG-4. Both store a temporary app-cache file. Native Save/export opens the system share/save sheet; it does not silently write into public storage. Web and Electron use the real MediaRecorder API with a supported MIME type (typically WebM/Opus; Safari may choose MP4). The web exports through an explicit download. Electron exports through a restricted, size-bounded IPC operation and a native save dialog; renderer code never chooses an arbitrary filesystem path. Microphone tracks and recording resources are released on completion/error/discard.

Web requires HTTPS/localhost, MediaRecorder and getUserMedia support. Electron allows audio-only capture from the trusted main app frame after an application confirmation; camera, screen capture, unrelated origins/subframes and other permissions stay denied. The packaged macOS app supplies its microphone purpose string and hardened-runtime audio-input entitlement. Windows/macOS may additionally need OS privacy permission; a denied or missing input is a real error, not simulated success. Linux requires a working audio input/session. Native microphone permission is requested only by Start recording. Do not test a real microphone without the person’s knowledge; automated browser/Electron tests use generated input and mocked save dialogs.

Temporary native recordings are deleted on discard, replacement or normal plugin teardown; a crash may leave a cache file until the OS clears it. Do not treat app cache as secure encrypted storage or a retention policy for client voice notes. Add a reviewed document-storage/export/retention design before using real client data. There is no background recording or call/system-audio capture.

## Other features and limits

Camera uses the official native camera/photo picker. Android needs no broad storage or app camera permission for this system-intent flow. iOS has camera/photo purpose strings. Browser fallback is a real image input with capture hint; camera invocation depends on the browser/device. The preview is temporary and local; no gallery saving or upload is requested. Requesting no EXIF metadata is not a guarantee that the underlying image is stripped of metadata. If Android terminates the app while the camera activity is open, reopen the demo and retry; automatic restoration of that interrupted preview is not implemented.

Battery/charging, language, orientation and lifecycle are snapshots. Motion reads one accelerometer sample and stops, with a five-second timeout and native background cleanup. Unsupported hardware or absent browser events are reported explicitly. Screen orientation is read, not forcibly locked. Permissions, hardware, OS and browser support determine availability; interface presence is not proof of functional hardware.

## Repeatable checks

Run `npm run check`, `npm run build:android`, `npm run cap:sync:ios` and `npm run test:desktop`. Browser tests cover GPS with injected test positions, permission denial, cleared/private outputs, carousel movement/snap/cancel, photo input/clearing, persisted preferences and generated-input audio record/play/export/discard. Electron tests cover generated-input audio, actual bounded file export with a mocked destination, sandbox/IPC/navigation checks and offline reload. These are not physical microphone/GPS tests. Android compilation and iOS project/resource validation are separate from runtime/device acceptance.

On a phone, test approximate and precise permission, permanently denied permission recovery, disabled Location services, GPS outdoors, watch stop/background/navigation, native Settings round trips, camera cancellation, audio permission denial, playback/export, background interruption and a second recording. On macOS/iOS/Windows repeat microphone capture with actual SDKs/OS permission dialogs. See verification.md for what was actually run.

Sources: [Capacitor Geolocation](https://capacitorjs.com/docs/apis/geolocation), [Camera](https://capacitorjs.com/docs/apis/camera), [Electron permission requests](https://www.electronjs.org/docs/latest/api/session#sessetpermissionrequesthandlerhandler), [Apple settings defaults](https://developer.apple.com/documentation/uikit/detecting-changes-in-the-preferences-window), [Android application preferences intent](https://developer.android.com/reference/android/content/Intent#ACTION_APPLICATION_PREFERENCES).
