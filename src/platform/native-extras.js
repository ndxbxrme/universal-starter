import { Capacitor, registerPlugin } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera, MediaTypeSelection } from "@capacitor/camera";
import { Browser } from "@capacitor/browser";
import { Share } from "@capacitor/share";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { capability } from "./capabilities.js";
import { locationError, locationOptions, locationResult } from "./location.js";
import { mapsUrl } from "./web-extras.js";
const StarterDevice = registerPlugin("StarterDevice");
export function createNativeExtras() {
  async function options() {
    const prefs = await StarterDevice.getPreferences();
    return { ...locationOptions, enableHighAccuracy: prefs.highAccuracy };
  }
  async function permission() {
    const p = await Geolocation.checkPermissions();
    if (p.location !== "granted" && p.coarseLocation !== "granted")
      await Geolocation.requestPermissions({ permissions: ["location"] });
  }
  const safePosition = async (action) => {
    try {
      await permission();
      return await action();
    } catch (e) {
      throw locationError(e);
    }
  };
  let recordingPath;
  return {
    audio: {
      start: () => StarterDevice.startRecording(),
      async stop() {
        const clip = await StarterDevice.stopRecording();
        recordingPath = clip.path;
        return {
          previewUrl: Capacitor.convertFileSrc(clip.path),
          mimeType: "audio/mp4",
          bytes: clip.bytes,
          durationMs: clip.durationMs,
        };
      },
      async cancel() {
        recordingPath = null;
        await StarterDevice.cancelRecording();
      },
      async export() {
        if (!recordingPath) throw new Error("Record a clip first");
        await Share.share({ files: [recordingPath] });
        return { requested: true };
      },
    },
    async capabilities() {
      let p = { location: "unknown", coarseLocation: "unknown" };
      try {
        p = await Geolocation.checkPermissions();
      } catch {
        /* Location services may be disabled independently of permission. */
      }
      return {
        audio: capability(
          Capacitor.isPluginAvailable("StarterDevice"),
          "unknown",
          "Native foreground microphone recording; nothing is uploaded.",
        ),
        geolocation: capability(
          Capacitor.isPluginAvailable("Geolocation"),
          p.coarseLocation === "granted"
            ? "granted"
            : p.location === "prompt-with-rationale"
              ? "prompt"
              : p.location,
          "Foreground only; approximate location accepted. No background permission.",
        ),
        camera: capability(
          Capacitor.isPluginAvailable("Camera"),
          "unknown",
          "Uses the system camera/photo picker; no gallery saving or metadata requested.",
        ),
        battery: capability(true, "granted"),
        locale: capability(true, "granted"),
        orientation: capability(
          Capacitor.isPluginAvailable("ScreenOrientation"),
          "granted",
        ),
        motion: capability(
          Capacitor.isPluginAvailable("StarterDevice"),
          "unknown",
          "One accelerometer sample; actual sensor availability checked on request.",
        ),
        appState: capability(true, "granted"),
        preferences: capability(
          Capacitor.isPluginAvailable("StarterDevice"),
          "granted",
        ),
        systemSettings: capability(
          Capacitor.isPluginAvailable("StarterDevice"),
          "granted",
        ),
        maps: capability(
          Capacitor.isPluginAvailable("Browser"),
          "granted",
          "Opens Google Maps only when requested; coordinates are sent to that service.",
        ),
      };
    },
    geolocation: {
      getCurrent: () =>
        safePosition(async () =>
          locationResult(await Geolocation.getCurrentPosition(await options())),
        ),
      watch: (listener, onError) =>
        safePosition(async () => {
          let active = true;
          const id = await Geolocation.watchPosition(
            await options(),
            (p, e) => {
              if (!active) return;
              if (e) onError(locationError(e));
              else if (p) listener(locationResult(p));
            },
          );
          return async () => {
            active = false;
            await Geolocation.clearWatch({ id });
          };
        }),
    },
    camera: {
      async capture() {
        const photo = await Camera.takePhoto({
          quality: 75,
          targetWidth: 1280,
          targetHeight: 1280,
          saveToGallery: false,
          includeMetadata: false,
          webUseInput: true,
        });
        return photoResult(photo);
      },
      async choose() {
        const result = await Camera.chooseFromGallery({
          mediaType: MediaTypeSelection.Photo,
          allowMultipleSelection: false,
          includeMetadata: false,
          webUseInput: true,
        });
        return photoResult(result.results[0]);
      },
    },
    battery: { getInfo: () => Device.getBatteryInfo() },
    locale: {
      async getInfo() {
        const [code, tag] = await Promise.all([
          Device.getLanguageCode(),
          Device.getLanguageTag(),
        ]);
        return { language: code.value, languageTag: tag.value };
      },
    },
    orientation: { getInfo: () => ScreenOrientation.orientation() },
    appState: {
      getInfo: () => App.getState(),
      subscribe(listener) {
        const ios = Capacitor.getPlatform() === "ios";
        const handles = [
          App.addListener("appStateChange", ({ isActive }) =>
            listener({ isActive, isBackground: !ios && !isActive }),
          ),
          App.addListener("pause", () =>
            listener({ isActive: false, isBackground: ios }),
          ),
        ];
        return () => {
          for (const handle of handles)
            handle.then((subscription) => subscription.remove());
        };
      },
    },
    motion: { sample: () => StarterDevice.sampleMotion() },
    preferences: {
      get: () => StarterDevice.getPreferences(),
      set: (values) => StarterDevice.setPreferences(values),
      open: () => StarterDevice.openPreferences(),
      openSystem: () => StarterDevice.openAppSettings(),
    },
    maps: {
      async open(p) {
        await Browser.open({ url: mapsUrl(p) });
        return { requested: true };
      },
    },
  };
}
function photoResult(photo) {
  if (!photo?.webPath) throw new Error("Photo unavailable");
  return {
    previewUrl: photo.webPath,
    format: photo.format || photo.type,
    release: () => {},
  };
}
