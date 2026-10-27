import { describe, it, expect, vi } from "vitest";
import { selectAdapter } from "../../src/platform/selection.js";
import { capability } from "../../src/platform/capabilities.js";
import {
  normalizeError,
  normalizePlatform,
  PlatformError,
} from "../../src/platform/contract.js";
import { createElectronPlatform } from "../../src/platform/electron.js";
describe("platform contract", () => {
  it("rejects forged/incomplete bridges and browser user agents", () => {
    expect(selectAdapter({ platform: "linux" }, null)).toBe("web");
    expect(selectAdapter(null, { isNativePlatform: () => false })).toBe("web");
  });
  it("selects official native runtime and versioned preload", () => {
    expect(
      selectAdapter(null, {
        isNativePlatform: () => true,
        getPlatform: () => "ios",
      }),
    ).toBe("capacitor");
    expect(
      selectAdapter(
        { version: 1, platform: "windows", invoke: () => {} },
        null,
      ),
    ).toBe("electron");
  });
  it("uses unavailable permissions for unsupported capabilities", () => {
    expect(capability(false, "granted")).toEqual({
      supported: false,
      permission: "unavailable",
    });
  });
  it("normalizes denial/cancellation without leaking raw errors", () => {
    expect(normalizeError({ name: "AbortError" }).code).toBe("CANCELLED");
    expect(normalizeError({ name: "NotAllowedError" }).code).toBe(
      "PERMISSION_DENIED",
    );
    expect(
      normalizeError(new Error("sensitive raw error")).message,
    ).not.toContain("sensitive");
    const error = new PlatformError("UNSUPPORTED", "Unavailable");
    expect(normalizeError(error)).toBe(error);
  });
  it("unwraps safe IPC results and errors", async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: { copied: true } })
      .mockResolvedValueOnce({
        ok: false,
        code: "CANCELLED",
        message: "Cancelled",
      });
    const adapter = createElectronPlatform({ platform: "linux", invoke });
    await expect(adapter.clipboard.writeText("hi")).resolves.toEqual({
      copied: true,
    });
    expect(invoke).toHaveBeenCalledWith("clipboard", { text: "hi" });
    await expect(adapter.files.pick()).rejects.toMatchObject({
      code: "CANCELLED",
    });
  });
});

it("normalizes adapter rejections at the public boundary", async () => {
  const adapter = normalizePlatform({
    id: "web",
    files: {
      pick: async () => {
        throw { name: "AbortError" };
      },
    },
  });
  await expect(adapter.files.pick()).rejects.toMatchObject({
    code: "CANCELLED",
  });
});

it("maps official native plugin cancellation and unavailability", () => {
  expect(normalizeError({ message: "Share canceled" }).code).toBe("CANCELLED");
  expect(normalizeError({ code: "UNIMPLEMENTED" }).code).toBe("UNSUPPORTED");
});
