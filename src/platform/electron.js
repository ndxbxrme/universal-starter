import { createWebAudio } from "./audio.js";
import { createWebExtras } from "./web-extras.js";
import { PlatformError } from "./contract.js";
export function createElectronPlatform(bridge) {
  const { capabilities: extraCapabilities, ...features } = createWebExtras({
    desktop: true,
  });
  const invoke = async (method, args) => {
    const result = await bridge.invoke(method, args);
    if (!result.ok) throw new PlatformError(result.code, result.message);
    return result.value;
  };
  return {
    ...features,
    audio: createWebAudio({
      exportClip: async (blob) => {
        const buffer = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const b of buffer) binary += String.fromCharCode(b);
        return invoke("audioExport", {
          data: btoa(binary),
          mimeType: blob.type,
        });
      },
    }),
    id: bridge.platform,
    device: { getInfo: () => invoke("device") },
    capabilities: {
      list: async () => ({
        ...(await extraCapabilities()),
        ...(await invoke("capabilities")),
      }),
    },
    notifications: { show: (options) => invoke("notifications", options) },
    haptics: { vibrate: () => invoke("haptics") },
    clipboard: { writeText: (text) => invoke("clipboard", { text }) },
    files: { pick: () => invoke("files") },
    share: { show: () => invoke("share") },
    network: {
      getStatus: async () => ({
        connected: navigator.onLine,
        connectionType: "unknown",
      }),
      subscribe(listener) {
        const update = () =>
          listener({ connected: navigator.onLine, connectionType: "unknown" });
        addEventListener("online", update);
        addEventListener("offline", update);
        return () => {
          removeEventListener("online", update);
          removeEventListener("offline", update);
        };
      },
    },
  };
}
