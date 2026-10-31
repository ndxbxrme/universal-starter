import { normalizeError } from "../platform/contract.js";
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
function btn(text, action) {
  const n = node("button", text, "button");
  n.type = "button";
  n.addEventListener("click", action);
  return n;
}
function card(title, text) {
  const n = node("section", null, "card");
  n.append(node("h2", title), node("p", text, "muted"));
  return n;
}
const failure = (output, error) => {
  const e = normalizeError(error);
  output.textContent = `${e.code}: ${e.message}`;
};
function lifecycle(platform, callback) {
  const hidden = () => {
    if (document.hidden) callback();
  };
  document.addEventListener("visibilitychange", hidden);
  const unsubscribe = platform.appState.subscribe(({ isActive }) => {
    if (!isActive) callback();
  });
  return () => {
    document.removeEventListener("visibilitychange", hidden);
    unsubscribe();
  };
}
export function locationPanel(platform, caps) {
  const root = card(
    "Find your location",
    "GPS / device location · foreground only. Coordinates stay in memory and are never added to diagnostics. Approximate access is accepted; the accuracy radius is not proof of a property boundary.",
  );
  const output = node("p", "No location requested.", "feature-output");
  output.setAttribute("role", "status");
  let alive = true,
    stopWatch,
    request = 0,
    position;
  const show = (p) => {
    if (!alive) return;
    position = p;
    output.textContent = `Latitude ${p.latitude.toFixed(6)} · Longitude ${p.longitude.toFixed(6)}\nAccuracy ±${Math.round(p.accuracy)} m · ${new Date(p.timestamp).toLocaleTimeString()}${p.altitude == null ? "" : ` · altitude ${Math.round(p.altitude)} m`}`;
    map.disabled = !caps.maps?.supported;
  };
  const stop = async () => {
    ++request;
    const stop = stopWatch;
    stopWatch = null;
    watch.disabled = !caps.geolocation?.supported;
    halt.disabled = true;
    if (stop) await stop();
  };
  const current = btn("Get my location", async () => {
    const revision = ++request;
    current.disabled = true;
    output.textContent = "Finding your location…";
    try {
      const p = await platform.geolocation.getCurrent();
      if (alive && revision === request) show(p);
    } catch (e) {
      if (alive) failure(output, e);
    } finally {
      if (alive) current.disabled = !caps.geolocation?.supported;
    }
  });
  const watch = btn("Follow location", async () => {
    watch.disabled = true;
    const revision = ++request;
    output.textContent = "Starting foreground location updates…";
    try {
      const cancel = await platform.geolocation.watch(
        (position) => {
          if (alive && revision === request) show(position);
        },
        (e) => {
          if (!alive || revision !== request) return;
          failure(output, e);
          stop().catch((e) => failure(output, e));
        },
      );
      if (!alive || revision !== request) {
        await cancel();
        return;
      }
      stopWatch = cancel;
      halt.disabled = false;
    } catch (e) {
      if (alive) {
        failure(output, e);
        watch.disabled = !caps.geolocation?.supported;
      }
    }
  });
  const halt = btn("Stop following", async () => {
    await stop();
    output.textContent = "Location updates stopped.";
  });
  halt.disabled = true;
  const clear = btn("Clear location", async () => {
    await stop();
    position = null;
    map.disabled = true;
    output.textContent = "Location cleared from this screen.";
  });
  const map = btn("Open this location in Google Maps", async () => {
    if (!position) return;
    try {
      await platform.maps.open(position);
    } catch (e) {
      failure(output, e);
    }
  });
  map.disabled = true;
  current.disabled = watch.disabled = !caps.geolocation?.supported;
  const controls = node("div", null, "controls");
  controls.append(current, watch, halt, clear, map);
  root.append(controls, output);
  const unbind = lifecycle(platform, () => {
    stop().catch((e) => failure(output, e));
    position = null;
    map.disabled = true;
    output.textContent =
      "Location cleared; updates stopped while the app is inactive.";
  });
  return {
    node: root,
    dispose() {
      alive = false;
      unbind();
      position = null;
      stop().catch(() => {});
    },
  };
}
export function audioPanel(platform, caps) {
  const root = card(
    "Record an audio note",
    "Microphone demo on every platform · up to 60 seconds. Audio stays local. Leaving this screen discards the clip; backgrounding stops an active recording; Save / export is an explicit action.",
  );
  const output = node(
    "p",
    caps.audio?.supported
      ? "Ready to record."
      : "Recording is unavailable here. Use a secure browser or rebuild the native app.",
    "recording-indicator",
  );
  output.setAttribute("role", "status");
  const player = node("audio");
  player.controls = true;
  player.hidden = true;
  player.setAttribute("aria-label", "Recorded audio playback");
  let alive = true,
    recording = false,
    busy = false,
    generation = 0,
    timer;
  const reset = async () => {
    ++generation;
    recording = false;
    clearTimeout(timer);
    player.pause();
    player.removeAttribute("src");
    player.load();
    player.hidden = true;
    await platform.audio.cancel();
    if (alive) {
      start.disabled = !caps.audio?.supported;
      stop.disabled = save.disabled = true;
      output.textContent = "Recording discarded; microphone released.";
    }
  };
  const start = btn("Start recording", async () => {
    if (busy) return;
    busy = true;
    player.pause();
    player.removeAttribute("src");
    player.load();
    player.hidden = true;
    start.disabled = true;
    save.disabled = true;
    const token = ++generation;
    output.textContent = "Requesting microphone…";
    try {
      await platform.audio.start();
      if (!alive || token !== generation) {
        await platform.audio.cancel();
        return;
      }
      recording = true;
      stop.disabled = false;
      output.textContent = "● Recording · microphone active";
      timer = setTimeout(() => stop.click(), 60000);
    } catch (e) {
      if (alive) {
        failure(output, e);
        start.disabled = false;
      }
    } finally {
      busy = false;
    }
  });
  const stop = btn("Stop recording", async () => {
    if (!recording || busy) return;
    busy = true;
    recording = false;
    stop.disabled = true;
    clearTimeout(timer);
    const token = generation;
    try {
      const clip = await platform.audio.stop();
      if (!alive || token !== generation) return;
      player.src = clip.previewUrl;
      player.hidden = false;
      save.disabled = false;
      start.disabled = false;
      output.textContent = `Recorded ${(clip.durationMs / 1000).toFixed(1)} seconds · ${Math.ceil(clip.bytes / 1024)} KiB · ${clip.mimeType}`;
    } catch (e) {
      if (alive) {
        failure(output, e);
        start.disabled = false;
      }
    } finally {
      busy = false;
    }
  });
  const save = btn("Save / export recording", async () => {
    try {
      await platform.audio.export();
      output.textContent = "Export requested. Complete the save/share dialog.";
    } catch (e) {
      failure(output, e);
    }
  });
  const discard = btn("Discard recording", () =>
    reset().catch((e) => failure(output, e)),
  );
  stop.disabled = save.disabled = true;
  start.disabled = !caps.audio?.supported;
  const controls = node("div", null, "controls");
  controls.append(start, stop, save, discard);
  root.append(controls, output, player);
  const unbind = lifecycle(platform, () => {
    player.pause();
    if (recording) reset().catch((e) => failure(output, e));
  });
  return {
    node: root,
    dispose() {
      alive = false;
      unbind();
      reset().catch(() => {});
    },
  };
}
export function cameraPanel(platform, caps) {
  const root = card(
    "Camera & photos",
    "Capture or choose a photo. The preview is temporary; no upload, gallery saving or EXIF metadata is requested.",
  );
  const output = node("p", null, "feature-output");
  output.setAttribute("role", "status");
  const preview = node("img", null, "device-preview");
  preview.alt = "Selected photo preview";
  preview.hidden = true;
  let photo,
    alive = true;
  const choose = async (method) => {
    try {
      const next = await platform.camera[method]();
      if (!alive) {
        next.release();
        return;
      }
      photo?.release();
      photo = next;
      preview.src = photo.previewUrl;
      preview.hidden = false;
      output.textContent = `Photo ready · ${photo.format || "image"}`;
    } catch (e) {
      if (alive) failure(output, e);
    }
  };
  const controls = node("div", null, "controls");
  for (const [label, method] of [
    ["Take a photo", "capture"],
    ["Choose a photo", "choose"],
  ]) {
    const b = btn(label, () => choose(method));
    b.disabled = !caps.camera?.supported;
    controls.append(b);
  }
  controls.append(
    btn("Clear photo", () => {
      photo?.release();
      photo = null;
      preview.removeAttribute("src");
      preview.hidden = true;
      output.textContent = "Photo cleared.";
    }),
  );
  root.append(controls, output, preview);
  return {
    node: root,
    dispose() {
      alive = false;
      photo?.release();
    },
  };
}
export async function preferencesPanel(platform) {
  const root = card(
    "Native preferences",
    "iOS: app preferences inside Settings. Android: a native preferences screen, linked from app info where the OS supports “Additional settings in the app”. These are app preferences, separate from OS permissions.",
  );
  const output = node("p", null, "feature-output");
  output.setAttribute("role", "status");
  const high = node("input");
  high.type = "checkbox";
  high.id = "location-accuracy";
  const highLabel = node(
    "label",
    " Prefer high-accuracy location (uses more power)",
  );
  highLabel.prepend(high);
  const units = node("select");
  units.id = "distance-unit";
  for (const [value, label] of [
    ["km", "Kilometres"],
    ["mi", "Miles"],
  ]) {
    const option = node("option", label);
    option.value = value;
    units.append(option);
  }
  const label = node("label", "Distance units");
  label.htmlFor = units.id;
  const field = node("div", null, "field");
  field.append(label, units);
  const load = async () => {
    const values = await platform.preferences.get();
    high.checked = values.highAccuracy;
    units.value = values.distanceUnit;
  };
  await load();
  const save = async () => {
    try {
      await platform.preferences.set({
        highAccuracy: high.checked,
        distanceUnit: units.value,
      });
      output.textContent =
        "Preferences saved. GPS uses the accuracy preference on its next request.";
    } catch (e) {
      failure(output, e);
    }
  };
  high.onchange = save;
  units.onchange = save;
  const controls = node("div", null, "controls");
  controls.append(
    btn("Open native preferences", async () => {
      try {
        await platform.preferences.open();
      } catch (e) {
        failure(output, e);
      }
    }),
    btn("Open app permissions in Settings", async () => {
      try {
        await platform.preferences.openSystem();
      } catch (e) {
        failure(output, e);
      }
    }),
    btn("Refresh preferences", () => load().catch((e) => failure(output, e))),
  );
  root.append(highLabel, field, controls, output);
  return root;
}
export function extraDemos(platform) {
  return [
    [
      "battery",
      "Battery & charging",
      "Read charge level and whether external power is connected.",
      () => platform.battery.getInfo(),
    ],
    [
      "locale",
      "Language & region",
      "Read language preferences without device identifiers.",
      () => platform.locale.getInfo(),
    ],
    [
      "orientation",
      "Screen orientation",
      "Read the current orientation; the layout stays responsive.",
      () => platform.orientation.getInfo(),
    ],
    [
      "motion",
      "A moment of motion",
      "Read one accelerometer sample. Sensors may be absent; no background listening.",
      () => platform.motion.sample(),
    ],
    [
      "appState",
      "App lifecycle",
      "Check whether this app is currently active.",
      () => platform.appState.getInfo(),
    ],
  ];
}
