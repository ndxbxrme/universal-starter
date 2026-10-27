# Android wireless development without USB

Prerequisites: Android 11+, working Wi-Fi, same trusted LAN, current Android platform-tools (`adb` on PATH), JDK 21 and SDK API 36. Older Android may need initial USB authorization; a broken USB socket cannot be guaranteed to work there.

1. Open Settings → About phone. Tap Build number seven times, unlock, then open Developer options.
2. Enable Wireless debugging. Tap “Pair device with pairing code”. Keep this page open; the six-digit code expires quickly.
3. Run `npm run android:pair`. Enter the pairing IP:port; adb asks for the code. Then enter the separate debugging IP:port on the main Wireless debugging page. They are different ports. No addresses/codes are saved.

Equivalent commands (replace the uppercase tokens with phone values):

```sh
adb pair PHONE_IP:PAIRING_PORT
adb connect PHONE_IP:DEBUG_PORT
adb devices -l
npm run build:android
npm run android:install -- --device PHONE_IP:DEBUG_PORT
npm run android:logs -- --device PHONE_IP:DEBUG_PORT
```

The phone should appear as `device`, not offline/unauthorized. Launch the app before streaming its PID-filtered logcat. The normal APK bundles assets and works without the dev server.

For hot reload, after pairing/connecting:

```sh
npm run dev:android -- --host YOUR_COMPUTER_LAN_IP --device PHONE_IP:DEBUG_PORT
```

Vite binds only that selectable interface. The script builds/syncs, injects a URL into ignored generated Android assets only, adds a debug-only cleartext manifest, builds/installs/launches, and keeps Vite running. Ctrl+C restores configuration. Never expose Vite/ADB publicly. If killed forcibly, run `npm run cap:sync:android` and remove the generated android/app/src/debug/AndroidManifest.xml before normal development. Release packaging resyncs and validates bundled configuration. The installed live-reload debug APK still points at the stopped server: run `npm run build:android` and `npm run android:install` to restore the normal offline app on the phone. Native plugin changes need a rebuild even when JavaScript hot reloads.

Troubleshooting: recheck main debug port after reconnect/reboot; re-run adb connect; re-pair after expired code or revoked authorization. mDNS discovery may fail on routers—explicit IP:port works without it. Disable VPN routing conflicts and allow the selected Vite port in your local firewall only on the trusted LAN. Guest Wi-Fi/client isolation prevents phone-to-computer traffic; switch networks. Turning wireless debugging off, changing networks or phone sleep can disconnect ADB. Use `adb disconnect` then reconnect to the current port. Do not assume successful web hot reload means a new native plugin is installed.

Physical USB-free pairing/install/live reload is unverified until performed on a real device. See verification.md.
