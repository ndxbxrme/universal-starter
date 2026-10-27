import { normalizePlatform } from "./contract.js";
import { Capacitor } from "@capacitor/core";
import { createWebPlatform } from "./web.js";
import { selectAdapter } from "./selection.js";
/** Select the adapter without prompting for permissions. */
export async function getPlatform() {
  const selected = selectAdapter(globalThis.universalDesktop, Capacitor);
  if (selected === "electron") {
    const { createElectronPlatform } = await import("./electron.js");
    return normalizePlatform(
      createElectronPlatform(globalThis.universalDesktop),
    );
  }
  if (selected === "capacitor") {
    const { createCapacitorPlatform } = await import("./capacitor.js");
    return normalizePlatform(await createCapacitorPlatform());
  }
  return normalizePlatform(createWebPlatform());
}
