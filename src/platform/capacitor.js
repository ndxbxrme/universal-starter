import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { Network } from "@capacitor/network";
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Clipboard } from "@capacitor/clipboard";
import { Share } from "@capacitor/share";
import { createWebPlatform } from "./web.js";
import { capability } from "./capabilities.js";
import { PlatformError } from "./contract.js";
/** Official plugins only. File input uses the native webview's system picker. */
export async function createCapacitorPlatform() {
  const id = Capacitor.getPlatform();
  if (id === "android")
    await App.addListener("backButton", async ({ canGoBack }) => {
      if (canGoBack && location.hash && location.hash !== "#/home")
        history.back();
      else if (location.hash !== "#/home") location.hash = "/home";
      else await App.exitApp();
    });
  return {
    id,
    device: {
      async getInfo() {
        const info = await Device.getInfo();
        const app = await App.getInfo();
        return {
          platform: info.platform,
          operatingSystem: info.operatingSystem,
          osVersion: info.osVersion,
          webViewVersion: info.webViewVersion,
          version: app.version,
          build: app.build,
        };
      },
    },
    capabilities: {
      async list() {
        const notifications = await LocalNotifications.checkPermissions();
        const share = await Share.canShare();
        return {
          notifications: capability(
            Capacitor.isPluginAvailable("LocalNotifications"),
            notifications.display === "prompt-with-rationale"
              ? "prompt"
              : notifications.display,
          ),
          haptics: capability(
            Capacitor.isPluginAvailable("Haptics"),
            "granted",
            "Physical haptic hardware is device-dependent; simulators may not vibrate.",
          ),
          clipboard: capability(
            Capacitor.isPluginAvailable("Clipboard"),
            "granted",
          ),
          files: capability(
            true,
            "granted",
            "System file picker through the native webview.",
          ),
          share: capability(share.value, "granted"),
          network: capability(
            Capacitor.isPluginAvailable("Network"),
            "granted",
          ),
          device: capability(Capacitor.isPluginAvailable("Device"), "granted"),
        };
      },
    },
    notifications: {
      async show({ title, body }) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== "granted")
          throw new PlatformError(
            "PERMISSION_DENIED",
            "Notifications denied. Enable them in app settings.",
          );
        await LocalNotifications.schedule({
          notifications: [
            {
              isExactNotification: false,
              id: Math.floor(Date.now() / 1000) % 2147483647,
              title,
              body,
              schedule: { at: new Date(Date.now() + 1000) },
            },
          ],
        });
        return { scheduled: true };
      },
    },
    haptics: {
      async vibrate({ durationMs }) {
        await Haptics.vibrate({ duration: durationMs });
        return { requested: true };
      },
    },
    clipboard: {
      async writeText(text) {
        await Clipboard.write({ string: text });
        return { copied: true };
      },
    },
    files: createWebPlatform().files,
    share: {
      async show(data) {
        await Share.share(data);
        return { shared: true };
      },
    },
    network: {
      getStatus: () => Network.getStatus(),
      subscribe(listener) {
        const handle = Network.addListener("networkStatusChange", listener);
        return () => {
          handle.then((subscription) => subscription.remove());
        };
      },
    },
  };
}
