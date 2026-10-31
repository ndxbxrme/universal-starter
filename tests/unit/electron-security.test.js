import { it, expect } from "vitest";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const policy = require("../../electron/security/policy.cjs");
it("restricts navigation and external URLs", () => {
  expect(policy.trusted("app://bundle/index.html#/home")).toBe(true);
  for (const url of [
    "file:///etc/passwd",
    "https://evil.test",
    "app://evil/index.html",
    "app://bundle/assets/code.js",
  ])
    expect(policy.trusted(url)).toBe(false);
  expect(
    policy.externalAllowed(
      "javascript:alert(1)",
      "https://example.com/support",
    ),
  ).toBe(false);
  expect(
    policy.externalAllowed(
      "https://example.com/support",
      "https://example.com/support",
    ),
  ).toBe(true);
  expect(
    policy.externalAllowed(
      "https://example.com.evil/support",
      "https://example.com/support",
    ),
  ).toBe(false);
});
it("validates IPC argument shapes and limits", () => {
  for (const [method, args] of [
    ["shell", {}],
    ["clipboard", { text: 123 }],
    ["files", { path: "/etc/passwd" }],
    ["notifications", { title: "x", body: "y", extra: true }],
  ])
    expect(() => policy.validate(method, args)).toThrow();
  expect(() => policy.validate("clipboard", { text: "hi" })).not.toThrow();
});
it("confines protocol reads including symlinks", () => {
  const root = mkdtempSync(path.join(tmpdir(), "universal-assets-"));
  writeFileSync(path.join(root, "index.html"), "hello");
  expect(policy.assetPath("app://bundle/index.html", root)).toBe(
    path.join(root, "index.html"),
  );
  expect(() => policy.assetPath("app://evil/index.html", root)).toThrow();
  if (process.platform !== "win32") {
    symlinkSync("/etc/passwd", path.join(root, "leak"));
    expect(() => policy.assetPath("app://bundle/leak", root)).toThrow();
  }
});
it("allows only trusted top-frame audio permission requests", () => {
  const contents = {};
  const details = {
    isMainFrame: true,
    requestingUrl: "app://bundle/index.html#/interactions",
    mediaTypes: ["audio"],
  };
  expect(policy.microphoneRequest(contents, "media", details, contents)).toBe(
    true,
  );
  for (const invalid of [
    { ...details, isMainFrame: false },
    { ...details, requestingUrl: "https://evil.test" },
    { ...details, mediaTypes: ["video"] },
    { ...details, mediaTypes: ["audio", "video"] },
  ])
    expect(policy.microphoneRequest(contents, "media", invalid, contents)).toBe(
      false,
    );
  expect(policy.microphoneRequest({}, "media", details, contents)).toBe(false);
  expect(
    policy.microphoneRequest(contents, "geolocation", details, contents),
  ).toBe(false);
});
it("bounds audio exports and rejects arbitrary paths and MIME types", () => {
  expect(() =>
    policy.validate("audioExport", { data: "YWJj", mimeType: "audio/webm" }),
  ).not.toThrow();
  for (const args of [
    { data: "YWJj", mimeType: "text/html" },
    { data: "YWJj", mimeType: "audio/webm", path: "/etc/passwd" },
    { data: "!", mimeType: "audio/webm" },
    { data: "a".repeat(12 * 1024 * 1024 + 1), mimeType: "audio/webm" },
  ])
    expect(() => policy.validate("audioExport", args)).toThrow();
});
