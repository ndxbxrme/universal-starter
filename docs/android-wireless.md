# Android wireless development without USB

Prerequisites: Android 11+, working Wi-Fi, same trusted LAN, current Android platform-tools (`adb` on PATH), JDK 21 and SDK API 36. Older Android may need initial USB authorization; a broken USB socket cannot be guaranteed to work there.

1. Open Settings → About phone. Tap Build number seven times, unlock, then open Developer options.
2. Enable Wireless debugging. Tap “Pair device with pairing code”. Keep this page open; the six-digit code expires quickly.
3. Run `npm run android:pair`. Enter the pairing IP:port; adb asks for the code. Then enter the separate debugging IP:port on the main Wireless debugging page. They are different ports. The address prompt closes before ADB reads the code, so ADB has exclusive terminal input; Ctrl+C cancels either prompt or the running pairing command. Code echo is controlled by ADB, not this helper. No addresses/codes are saved by the helper (ADB itself retains its normal pairing trust).

Equivalent commands (replace the uppercase tokens with phone values):

```sh
adb pair PHONE_IP:PAIRING_PORT
adb connect PHONE_IP:DEBUG_PORT
adb devices -l
npm run build:android
npm run android:install
npm run android:logs
```

The phone should appear as `device`, not offline/unauthorized. With exactly one authorized device connected, omit `--device`. With multiple targets, use **only the first column** from `adb devices -l`, not the full line or the phone’s display/model name. For example:

```text
adb-example-random._adb-tls-connect._tcp device product:example model:Example transport_id:3
```

```sh
npm run android:install -- --device "adb-example-random._adb-tls-connect._tcp"
npm run android:logs -- --device "adb-example-random._adb-tls-connect._tcp"
```

Wireless ADB may use an mDNS service name as its serial. The install/log/live helpers also accept `--device PHONE_IP:DEBUG_PORT`: if not already listed, they connect to that address and resolve its exact transport or matching mDNS service. If mDNS discovery is unavailable, use the listed serial instead; the helper never guesses among multiple phones. `ANDROID_SERIAL` supplies the default selection when `--device` is omitted. These rules apply to install/log/live; native test scripts require the exact ADB serial.

Launch the app before streaming its PID-filtered logcat. The normal APK bundles assets and works without the dev server.

For hot reload, after pairing/connecting:

```sh
npm run dev:android -- --host YOUR_COMPUTER_LAN_IP --device ADB_SERIAL_FROM_FIRST_COLUMN
```

Vite binds only that selectable interface. The script builds/syncs, injects a URL into ignored generated Android assets only, stages a debug-only cleartext manifest copy under android/app/build/universal-live (preserving any app-owned source debug manifest), builds/installs/launches, and keeps Vite running. Ctrl+C restores configuration. Never expose Vite/ADB publicly. If killed forcibly, run `npm run cap:sync:android` before normal development; the ignored staging manifest is selected only by the live helper’s child Gradle invocation. Source debug manifests are never overwritten. Release packaging resyncs and validates bundled configuration. The installed live-reload debug APK still points at the stopped server: run `npm run build:android` and `npm run android:install` to restore the normal offline app on the phone. Native plugin changes need a rebuild even when JavaScript hot reloads.

Troubleshooting: recheck main debug port after reconnect/reboot; re-run adb connect; re-pair after expired code or revoked authorization. mDNS discovery may fail on routers—explicit IP:port works without it. Disable VPN routing conflicts and allow the selected Vite port in your local firewall only on the trusted LAN. Guest Wi-Fi/client isolation prevents phone-to-computer traffic; switch networks. Turning wireless debugging off, changing networks or phone sleep can disconnect ADB. Use `adb disconnect` then reconnect to the current port. Do not assume successful web hot reload means a new native plugin is installed.

Device evidence: on 31 October 2026 the user reported successful manual wireless pairing, APK installation using the mDNS serial, and app launch on a Pixel 6. The original helper hung during code entry. Its terminal-ownership/cancellation fix and device resolution are regression-tested locally with a fake ADB process, not a phone. Retesting the revised pairing helper, live reload and individual native capabilities on a physical device remains outstanding. See verification.md.

The mDNS serial/endpoint distinction is documented in the [official ADB Wi-Fi architecture](https://android.googlesource.com/platform/packages/modules/adb/+/HEAD/docs/dev/adb_wifi.md). To repeat the POSIX pseudo-terminal regression (no phone/network operations), run `python3 tests/cli/android-pair-pty.py`.
