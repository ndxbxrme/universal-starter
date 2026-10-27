# Small-group beta testing

Start with a reviewed version/build number, privacy declarations and release notes; run local/CI verification. Use the beta channel and protected beta environment. A CI artifact is a download, not a store deployment. Keep client accounts and signing material under client ownership.

Android: debug APK is for development only. For Play internal/closed testing, create a signed upload AAB with the existing client upload key, verify its signature, configure Play App Signing/tester access and complete required declarations in Play Console. For direct small-group beta, an approved signed APK can be produced in Studio/Gradle with the same signing continuity, distributed securely, and installed by testers who accept sideload prompts. Do not distribute an unsigned AAB or call an AAB directly installable. Wireless ADB is a separate developer acceptance check.

iOS: simulator .app is not an iPhone IPA. Use a client-signed archive/export for the selected distribution method. TestFlight requires App Store Connect access, matching app registration, processing/privacy/export information and internal/external tester eligibility/review. Development/ad-hoc exports need appropriate registered devices/profiles and device Developer Mode/trust where applicable. Verify on a real iPhone before inviting users.

Desktop: distribute the target OS installer from a reviewed draft/release with SHA-256 checksums and notes. Windows signing and macOS Developer ID plus notarization reduce installation friction; unsigned builds can show warnings. Linux distro/package compatibility must be tested. Test install, launch/offline use, permissions, resizing, uninstall and upgrade from the prior beta. Updates are manual until a trusted updater is configured/tested.

Web: deploy a reviewed Pages build after enabling Actions-based Pages, share the actual deployment URL, and test a non-root path, browser back, touch, keyboard and offline navigation. Roll back by redeploying the previous reviewed commit. This starter does not install a service worker, so an offline reload is not promised.

Collect reports with version/channel/platform and redacted diagnostics; never ask testers to send signing credentials or sensitive files. Promote only after owner approval and all relevant verification checks are PASS or explicitly accepted BLOCKED items.
