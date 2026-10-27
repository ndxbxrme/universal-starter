import { normalizePlatform } from "./contract.js";
import { Capacitor } from "@capacitor/core";
import { createWebPlatform } from "./web.js";
import { selectAdapter } from "./selection.js";
/** Attach build metadata after normalizing the adapter methods. */
function publicPlatform(adapter) {
  return {
    ...normalizePlatform(adapter),
    channel: typeof __BUILD__ === "undefined" ? "dev" : __BUILD__.channel,
  };
}
/** Select the runtime and build channel without prompting for permissions. */
export async function getPlatform() {
  const selected = selectAdapter(globalThis.universalDesktop, Capacitor);
  if (selected === "electron") {
    const { createElectronPlatform } = await import("./electron.js");
    return publicPlatform(createElectronPlatform(globalThis.universalDesktop));
  }
  if (selected === "capacitor") {
    const { createCapacitorPlatform } = await import("./capacitor.js");
    return publicPlatform(await createCapacitorPlatform());
  }
  return publicPlatform(createWebPlatform());
}
