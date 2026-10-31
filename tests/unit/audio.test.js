import { it, expect, vi, afterEach } from "vitest";
import { createWebAudio } from "../../src/platform/audio.js";
afterEach(() => vi.unstubAllGlobals());
it("releases microphone tracks when recording startup fails", async () => {
  const stop = vi.fn();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [{ stop }] }),
    },
  });
  class Recorder {
    static isTypeSupported() {
      return true;
    }
    constructor() {
      throw new Error("encoder failed");
    }
  }
  vi.stubGlobal("MediaRecorder", Recorder);
  await expect(createWebAudio().start()).rejects.toThrow("encoder failed");
  expect(stop).toHaveBeenCalledOnce();
});
it("cancels a pending microphone request without starting a recorder", async () => {
  let resolve;
  const stop = vi.fn();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: () =>
        new Promise((r) => {
          resolve = r;
        }),
    },
  });
  const Recorder = vi.fn();
  vi.stubGlobal("MediaRecorder", Recorder);
  const audio = createWebAudio();
  const start = audio.start();
  await audio.cancel();
  resolve({ getTracks: () => [{ stop }] });
  await expect(start).rejects.toMatchObject({ code: "CANCELLED" });
  expect(stop).toHaveBeenCalledOnce();
  expect(Recorder).not.toHaveBeenCalled();
});
it("refuses export before recording and unavailable microphone APIs", async () => {
  vi.stubGlobal("navigator", {});
  await expect(createWebAudio().export()).rejects.toMatchObject({
    code: "FAILED",
  });
  await expect(createWebAudio().start()).rejects.toMatchObject({
    code: "UNSUPPORTED",
  });
});
