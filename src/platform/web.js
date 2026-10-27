import { capability } from "./capabilities.js";
import { PlatformError, unsupported } from "./contract.js";
export function createWebPlatform() {
  const secure = globalThis.isSecureContext;
  const network = {
    getStatus: async () => ({
      connected: navigator.onLine,
      connectionType: "unknown",
    }),
    subscribe(listener) {
      const notify = () =>
        listener({ connected: navigator.onLine, connectionType: "unknown" });
      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
      };
    },
  };
  return {
    id: "web",
    device: {
      getInfo: async () => ({
        platform: "web",
        language: navigator.language,
        runtime: "Browser",
        screen: `${screen.width} × ${screen.height}`,
      }),
    },
    capabilities: {
      list: async () => ({
        notifications: capability(
          secure && "Notification" in globalThis,
          globalThis.Notification?.permission === "default"
            ? "prompt"
            : globalThis.Notification?.permission || "unavailable",
          "Browser local notifications need a secure context and browser support.",
        ),
        haptics: capability(
          "vibrate" in navigator,
          "granted",
          "Some browsers ignore vibration.",
        ),
        clipboard: capability(secure && !!navigator.clipboard, "unknown"),
        files: capability(true, "granted"),
        share: capability(!!navigator.share, "unknown"),
        network: capability(true, "granted"),
        device: capability(true, "granted"),
      }),
    },
    notifications: {
      async show({ title, body }) {
        if (!secure || !("Notification" in globalThis))
          unsupported("Local notifications are unavailable in this browser.");
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
          throw new PlatformError(
            "PERMISSION_DENIED",
            "Notifications denied. Change permission in browser settings.",
          );
        new Notification(title, { body });
        return { requested: true };
      },
    },
    haptics: {
      async vibrate({ durationMs }) {
        if (!navigator.vibrate) unsupported("Vibration is unavailable.");
        if (!navigator.vibrate(durationMs))
          unsupported("The browser declined vibration.");
        return { requested: true };
      },
    },
    clipboard: {
      async writeText(text) {
        if (!secure || !navigator.clipboard)
          unsupported("Clipboard requires a secure supported browser.");
        await navigator.clipboard.writeText(text);
        return { copied: true };
      },
    },
    files: {
      pick({ accept = [] } = {}) {
        return new Promise((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = accept.join(",");
          input.hidden = true;
          document.body.append(input);
          const done = () => input.remove();
          input.addEventListener(
            "change",
            () => {
              const file = input.files[0];
              done();
              if (!file)
                reject(new PlatformError("CANCELLED", "No file selected"));
              else
                resolve({ name: file.name, size: file.size, type: file.type });
            },
            { once: true },
          );
          input.addEventListener(
            "cancel",
            () => {
              done();
              reject(
                new PlatformError("CANCELLED", "File selection cancelled"),
              );
            },
            { once: true },
          );
          input.click();
        });
      },
    },
    share: {
      async show(data) {
        if (!navigator.share) unsupported("Sharing is unavailable.");
        await navigator.share(data);
        return { shared: true };
      },
    },
    network,
  };
}
