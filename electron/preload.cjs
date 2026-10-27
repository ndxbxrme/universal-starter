const { contextBridge, ipcRenderer } = require("electron");
const methods = new Set([
  "device",
  "capabilities",
  "notifications",
  "clipboard",
  "files",
  "haptics",
  "share",
]);
const platforms = { win32: "windows", darwin: "macos", linux: "linux" };
contextBridge.exposeInMainWorld(
  "universalDesktop",
  Object.freeze({
    version: 1,
    sandboxed: process.sandboxed,
    platform: platforms[process.platform],
    invoke(method, args) {
      if (!methods.has(method))
        return Promise.resolve({
          ok: false,
          code: "FAILED",
          message: "Method not allowed",
        });
      return ipcRenderer.invoke("universal:invoke", method, args);
    },
  }),
);
