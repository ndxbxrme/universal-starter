import { it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  prefs: {
    getPreferences: vi.fn(async () => ({
      highAccuracy: false,
      distanceUnit: "mi",
    })),
    startRecording: vi.fn(),
    stopRecording: vi.fn(async () => ({
      path: "file:///private/clip.m4a",
      bytes: 123,
      durationMs: 1000,
    })),
    cancelRecording: vi.fn(),
  },
  events: {},
  remove: vi.fn(),
  geo: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  camera: { takePhoto: vi.fn(), chooseFromGallery: vi.fn() },
  share: vi.fn(),
  browser: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isPluginAvailable: () => true,
    getPlatform: () => "ios",
    convertFileSrc: () => "capacitor://localhost/clip.m4a",
  },
  registerPlugin: () => mocks.prefs,
}));
vi.mock("@capacitor/geolocation", () => ({ Geolocation: mocks.geo }));
vi.mock("@capacitor/camera", () => ({
  Camera: mocks.camera,
  MediaTypeSelection: { Photo: 0 },
}));
vi.mock("@capacitor/browser", () => ({ Browser: { open: mocks.browser } }));
vi.mock("@capacitor/share", () => ({ Share: { share: mocks.share } }));
vi.mock("@capacitor/device", () => ({ Device: {} }));
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: async (name, listener) => {
      mocks.events[name] = listener;
      return { remove: mocks.remove };
    },
  },
}));
vi.mock("@capacitor/screen-orientation", () => ({ ScreenOrientation: {} }));
import { createNativeExtras } from "../../src/platform/native-extras.js";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.geo.checkPermissions.mockResolvedValue({
    location: "denied",
    coarseLocation: "granted",
  });
});
it("accepts approximate location without requesting fine permission again", async () => {
  mocks.geo.getCurrentPosition.mockResolvedValue({
    timestamp: 1,
    coords: { latitude: 53, longitude: -1, accuracy: 2000 },
  });
  const value = await createNativeExtras().geolocation.getCurrent();
  expect(value.accuracy).toBe(2000);
  expect(mocks.geo.requestPermissions).not.toHaveBeenCalled();
  expect(mocks.geo.getCurrentPosition).toHaveBeenCalledWith(
    expect.objectContaining({ enableHighAccuracy: false, timeout: 20000 }),
  );
});
it("clears the exact native watch and suppresses late callbacks after stopping", async () => {
  let callback;
  mocks.geo.watchPosition.mockImplementation(async (_options, cb) => {
    callback = cb;
    return "watch-one";
  });
  const received = vi.fn(),
    error = vi.fn();
  const stop = await createNativeExtras().geolocation.watch(received, error);
  callback({
    timestamp: 1,
    coords: { latitude: 53, longitude: -1, accuracy: 40 },
  });
  expect(received).toHaveBeenCalledOnce();
  await stop();
  expect(mocks.geo.clearWatch).toHaveBeenCalledWith({ id: "watch-one" });
  callback({
    timestamp: 2,
    coords: { latitude: 53, longitude: -1, accuracy: 40 },
  });
  expect(received).toHaveBeenCalledOnce();
});
it("maps native location denial and returns preview URLs instead of raw recording paths", async () => {
  mocks.geo.checkPermissions.mockRejectedValueOnce({
    code: "OS-PLUG-GLOC-0003",
  });
  await expect(
    createNativeExtras().geolocation.getCurrent(),
  ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  const adapter = createNativeExtras();
  const clip = await adapter.audio.stop();
  expect(clip).not.toHaveProperty("path");
  expect(clip.previewUrl).toBe("capacitor://localhost/clip.m4a");
  await adapter.audio.export();
  expect(mocks.share).toHaveBeenCalledWith({
    files: ["file:///private/clip.m4a"],
  });
  await adapter.audio.cancel();
  await expect(adapter.audio.export()).rejects.toThrow();
});
it("uses the native single-photo picker and never requests gallery saving or EXIF", async () => {
  mocks.camera.chooseFromGallery.mockResolvedValue({
    results: [{ webPath: "capacitor://localhost/photo.jpg", format: "jpeg" }],
  });
  await createNativeExtras().camera.choose();
  expect(mocks.camera.chooseFromGallery).toHaveBeenCalledWith(
    expect.objectContaining({
      mediaType: 0,
      allowMultipleSelection: false,
      includeMetadata: false,
    }),
  );
});

it("distinguishes iOS permission-dialog inactivity from actual backgrounding", async () => {
  const received = vi.fn();
  const stop = createNativeExtras().appState.subscribe(received);
  mocks.events.appStateChange({ isActive: false });
  expect(received).toHaveBeenLastCalledWith({
    isActive: false,
    isBackground: false,
  });
  mocks.events.pause();
  expect(received).toHaveBeenLastCalledWith({
    isActive: false,
    isBackground: true,
  });
  stop();
  await Promise.resolve();
  expect(mocks.remove).toHaveBeenCalledTimes(2);
});
