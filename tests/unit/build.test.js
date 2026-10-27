import { it, expect, afterEach, vi } from "vitest";
import vite from "../../vite.config.js";
afterEach(() => vi.unstubAllEnvs());
it("isolates native bundles from Pages paths", () => {
  vi.stubEnv("WEB_BASE", "/client-repo/");
  expect(vite({ mode: "native" }).base).toBe("./");
  expect(vite({ mode: "web" }).base).toBe("/client-repo/");
});
it("rejects unsafe base paths and unknown release channels", () => {
  vi.stubEnv("WEB_BASE", '/"><script>/');
  expect(() => vite({ mode: "web" })).toThrow("WEB_BASE");
  vi.stubEnv("APP_CHANNEL", "untrusted");
  expect(() => vite({ mode: "native" })).toThrow("APP_CHANNEL");
});

it("permits only reviewed release channels for signing builds", async () => {
  const { assertReleaseChannel } = await import("../../scripts/lib.mjs");
  for (const channel of ["dev", "ci", undefined, "unknown"])
    expect(() => assertReleaseChannel(channel)).toThrow();
  expect(() => assertReleaseChannel("beta")).not.toThrow();
  expect(() => assertReleaseChannel("production")).not.toThrow();
});
