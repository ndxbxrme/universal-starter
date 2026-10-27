import { it, expect, vi } from "vitest";
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "ios", isPluginAvailable: () => true },
}));
vi.mock("@capacitor/app", () => ({
  App: { getInfo: async () => ({ version: "0.1.0", build: "1" }) },
}));
vi.mock("@capacitor/device", () => ({
  Device: {
    getInfo: async () => ({
      platform: "ios",
      operatingSystem: "ios",
      osVersion: "26",
      model: "private model",
      name: "private device",
    }),
  },
}));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: "denied" }),
    requestPermissions: vi.fn(async () => ({ display: "denied" })),
    schedule: vi.fn(),
  },
}));
vi.mock("@capacitor/share", () => ({
  Share: { canShare: async () => ({ value: true }) },
}));
import { createCapacitorPlatform } from "../../src/platform/capacitor.js";
it("maps denied native permissions without prompting or claiming unsupported", async () => {
  const adapter = await createCapacitorPlatform();
  expect((await adapter.capabilities.list()).notifications).toEqual({
    supported: true,
    permission: "denied",
  });
  await expect(
    adapter.notifications.show({ title: "hi", body: "hi" }),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
});
it("omits device names and identifiers from diagnostics", async () => {
  const adapter = await createCapacitorPlatform();
  const info = await adapter.device.getInfo();
  expect(info.version).toBe("0.1.0");
  expect(info).not.toHaveProperty("name");
  expect(info).not.toHaveProperty("model");
});

it("schedules inexact notifications without exact-alarm access", async () => {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  LocalNotifications.requestPermissions.mockResolvedValueOnce({
    display: "granted",
  });
  const adapter = await createCapacitorPlatform();
  await expect(
    adapter.notifications.show({ title: "Demo", body: "Hello" }),
  ).resolves.toEqual({ scheduled: true });
  expect(LocalNotifications.schedule).toHaveBeenCalledWith({
    notifications: [
      expect.objectContaining({ isExactNotification: false, title: "Demo" }),
    ],
  });
});
