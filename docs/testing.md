# Testing

Run `npm test` for deterministic unit tests and `npm run lint` for ESLint. `npm run format:check` checks formatting. Install Chromium with `npx playwright install chromium`, then `npm run test:e2e`. On Linux, missing shared libraries require the packages listed by `npx playwright install-deps chromium` (administrator installation may be needed).

Browser tests build a real production bundle under `/starter-test/` and use desktop and phone viewport profiles. They cover navigation/history, persisted theme, pointer and keyboard carousel movement, offline navigation, unsupported sharing and subpath assets. Browser profiles do not verify physical devices or native plugins.

Use `npm run check` for lint, formatting, unit and browser tests. Build outputs and test traces are ignored. Failure traces are in test-results. Native smoke coverage will be documented as wrappers are added.

Automated axe checks cover all five views in light and dark themes, using WCAG 2 A/AA and 2.1 AA tags. This complements keyboard tests and screenshot inspection; it does not establish full accessibility conformance.

Mobile smoke flows in `tests/mobile/smoke.yaml` use Maestro and real installed apps: Home → Interactions → Device plugin result → Diagnostics, plus screenshots. Install a pinned Maestro CLI release and expose its bin directory on PATH. No hosted Maestro service is required. Use `npm run test:android -- --device SERIAL` or `npm run test:ios -- --device UDID` on a booted target. `test:mobile` runs Android and, on macOS, iOS; it explicitly reports the unsupported iOS host on Linux/Windows. SDKs/devices are required and failures propagate.

Android instrumentation checks the installed APK asset config/CSP before Maestro UI/plugin smoke. The actual sandbox-enabled Electron smoke can target a packaged binary with ELECTRON_SMOKE_EXECUTABLE; local Linux test-build and packaged ASAR runs passed. test:release-guard temporarily injects development config into ignored generated Android assets, invokes the real Gradle guard and restores the original in finally. It requires the Android build prerequisites and does not produce a development release.
