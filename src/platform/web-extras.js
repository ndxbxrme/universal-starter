import { createWebAudio } from "./audio.js";
import { capability } from "./capabilities.js";
import { PlatformError, unsupported } from "./contract.js";
import { locationError, locationOptions, locationResult } from "./location.js";
export function createWebExtras({ desktop = false } = {}) {
  const geo = () => {
    if (desktop || !globalThis.isSecureContext || !navigator.geolocation)
      unsupported(
        "Location needs a supported secure browser or native mobile app.",
      );
    return navigator.geolocation;
  };
  return {
    audio: createWebAudio(),
    async capabilities() {
      let permission = "unknown";
      try {
        permission = (
          await navigator.permissions.query({ name: "geolocation" })
        ).state;
      } catch {
        /* Permissions query is optional. */
      }
      return {
        audio: capability(
          globalThis.isSecureContext &&
            !!navigator.mediaDevices?.getUserMedia &&
            !!globalThis.MediaRecorder,
          "unknown",
          "Local microphone recording; hardware/OS permission required.",
        ),
        geolocation: capability(
          !desktop && globalThis.isSecureContext && !!navigator.geolocation,
          permission,
          "Foreground only. Accuracy depends on hardware and permissions.",
        ),
        camera: capability(
          !desktop,
          "prompt",
          "Browser file input/camera capture; device support varies.",
        ),
        battery: capability(!desktop && !!navigator.getBattery, "unknown"),
        locale: capability(true, "granted"),
        orientation: capability(!!screen.orientation, "granted"),
        motion: capability(
          !desktop &&
            globalThis.isSecureContext &&
            !!globalThis.DeviceMotionEvent,
          "unknown",
          "Sensor events may be unavailable; samples time out honestly.",
        ),
        appState: capability(true, "granted"),
        preferences: capability(
          true,
          "granted",
          "Local browser preferences; native system Settings integration requires Android/iOS.",
        ),
        systemSettings: capability(
          false,
          "unavailable",
          "Browsers cannot open native application settings.",
        ),
        maps: capability(
          !desktop,
          "granted",
          "Explicitly opens Google Maps; coordinates leave the app only on request.",
        ),
      };
    },
    geolocation: {
      getCurrent: () =>
        new Promise((resolve, reject) =>
          geo().getCurrentPosition(
            (p) => resolve(locationResult(p)),
            (e) => reject(locationError(e)),
            {
              ...locationOptions,
              enableHighAccuracy:
                localStorage.getItem("native-high-accuracy") !== "false",
            },
          ),
        ),
      async watch(listener, onError) {
        const api = geo();
        let active = true;
        const id = api.watchPosition(
          (p) => {
            if (active) listener(locationResult(p));
          },
          (e) => {
            if (active) onError(locationError(e));
          },
          {
            ...locationOptions,
            enableHighAccuracy:
              localStorage.getItem("native-high-accuracy") !== "false",
          },
        );
        return async () => {
          active = false;
          api.clearWatch(id);
        };
      },
    },
    camera: {
      capture: () => pickPhoto(true),
      choose: () => pickPhoto(false),
    },
    battery: {
      async getInfo() {
        if (desktop || !navigator.getBattery)
          unsupported("Battery information is unavailable.");
        const b = await navigator.getBattery();
        return { batteryLevel: b.level, isCharging: b.charging };
      },
    },
    locale: {
      getInfo: async () => ({
        language: navigator.language,
        languages: [...navigator.languages],
      }),
    },
    orientation: {
      async getInfo() {
        if (!screen.orientation) unsupported("Orientation is unavailable.");
        return {
          type: screen.orientation.type,
          angle: screen.orientation.angle,
        };
      },
    },
    appState: {
      getInfo: async () => ({
        isActive: document.visibilityState === "visible",
      }),
      subscribe(listener) {
        const update = () =>
          listener({
            isActive: document.visibilityState === "visible",
            isBackground: document.hidden,
          });
        document.addEventListener("visibilitychange", update);
        return () => document.removeEventListener("visibilitychange", update);
      },
    },
    motion: {
      async sample() {
        if (
          desktop ||
          !globalThis.isSecureContext ||
          !globalThis.DeviceMotionEvent
        )
          unsupported("Motion sensors are unavailable.");
        if (
          DeviceMotionEvent.requestPermission &&
          (await DeviceMotionEvent.requestPermission()) !== "granted"
        )
          throw new PlatformError(
            "PERMISSION_DENIED",
            "Motion permission denied.",
          );
        return new Promise((resolve, reject) => {
          const cleanup = () => {
            clearTimeout(timer);
            removeEventListener("devicemotion", read);
          };
          const read = (event) => {
            const a = event.accelerationIncludingGravity;
            if (a?.x == null) return;
            cleanup();
            resolve({
              accelerationIncludingGravity: { x: a.x, y: a.y, z: a.z },
              interval: event.interval,
            });
          };
          const timer = setTimeout(() => {
            cleanup();
            reject(
              new PlatformError(
                "UNSUPPORTED",
                "No motion samples arrived on this device.",
              ),
            );
          }, 5000);
          addEventListener("devicemotion", read);
        });
      },
    },
    preferences: {
      async get() {
        return {
          highAccuracy:
            localStorage.getItem("native-high-accuracy") !== "false",
          distanceUnit:
            localStorage.getItem("native-distance-unit") === "mi" ? "mi" : "km",
        };
      },
      async set(values) {
        localStorage.setItem(
          "native-high-accuracy",
          String(values.highAccuracy),
        );
        localStorage.setItem(
          "native-distance-unit",
          values.distanceUnit === "mi" ? "mi" : "km",
        );
      },
      open: async () =>
        unsupported("Native preferences are available on Android/iOS only."),
      openSystem: async () =>
        unsupported(
          "Open this website’s permissions through your browser settings.",
        ),
    },
    maps: {
      async open(position) {
        if (desktop) unsupported("Desktop map opening is not configured.");
        const url = mapsUrl(position);
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        void opened;
        return { requested: true };
      },
    },
  };
}
export function mapsUrl({ latitude, longitude }) {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    throw new PlatformError("FAILED", "Invalid map coordinates.");
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
function pickPhoto(capture) {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (capture) input.setAttribute("capture", "environment");
    input.hidden = true;
    document.body.append(input);
    input.addEventListener(
      "cancel",
      () => {
        input.remove();
        reject(new PlatformError("CANCELLED", "Photo selection cancelled."));
      },
      { once: true },
    );
    input.addEventListener(
      "change",
      () => {
        const file = input.files[0];
        input.remove();
        if (!file || !file.type.startsWith("image/")) {
          reject(new PlatformError("CANCELLED", "No image selected."));
          return;
        }
        const previewUrl = URL.createObjectURL(file);
        resolve({
          previewUrl,
          format: file.type,
          release: () => URL.revokeObjectURL(previewUrl),
        });
      },
      { once: true },
    );
    input.click();
  });
}
