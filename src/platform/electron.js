import { PlatformError } from "./contract.js";
export function createElectronPlatform(bridge) {
  const invoke = async (method, args) => {
    const result = await bridge.invoke(method, args);
    if (!result.ok) throw new PlatformError(result.code, result.message);
    return result.value;
  };
  return {
    id: bridge.platform,
    device: { getInfo: () => invoke("device") },
    capabilities: { list: () => invoke("capabilities") },
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
