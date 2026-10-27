import { it, expect } from "vitest";
import { liveManifest } from "../../scripts/live-manifest.mjs";
it("creates a debug-only overlay and preserves custom manifest content", () => {
  const original =
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"><uses-permission android:name="client.permission"/><application android:label="Client" android:usesCleartextTraffic="false" tools:replace="android:label" /></manifest>';
  const result = liveManifest(original);
  expect(result).toContain('android:label="Client"');
  expect(result).toContain("client.permission");
  expect(result).toContain('android:usesCleartextTraffic="true"');
  expect(result).toContain(
    'tools:replace="android:label,android:usesCleartextTraffic"',
  );
  expect(original).toContain('android:usesCleartextTraffic="false"');
});
it("handles projects without a source debug manifest and rejects unknown XML safely", () => {
  expect(liveManifest()).toContain('android:usesCleartextTraffic="true"');
  expect(() => liveManifest("<unexpected/>")).toThrow(
    "source manifest left intact",
  );
});
