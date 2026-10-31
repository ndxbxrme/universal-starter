const {
  app,
  BrowserWindow,
  protocol,
  net,
  ipcMain,
  session,
  dialog,
  clipboard,
  Notification,
  Menu,
  shell,
} = require("electron");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs/promises");
const config = require("../universal-app.config.json");
const policy = require("./security/policy.cjs");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
let window;
let microphoneApproved = false;
const devUrl = process.env.DESKTOP_DEV_URL;
if (devUrl && (app.isPackaged || !/^http:\/\/127\.0\.0\.1:\d+\/$/.test(devUrl)))
  throw new Error(
    "Only an explicitly enabled loopback dev server is permitted in unpackaged development.",
  );
const root = path.join(__dirname, "../dist/native");
function capability(supported, reason) {
  return {
    supported,
    permission: supported ? "unknown" : "unavailable",
    ...(reason ? { reason } : {}),
  };
}
async function invoke(event, method, args) {
  try {
    if (
      !window ||
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      !policy.trusted(event.senderFrame.url, devUrl)
    )
      throw new Error("Untrusted sender");
    policy.validate(method, args);
  } catch {
    return { ok: false, code: "FAILED", message: "Request denied" };
  }
  try {
    let value;
    if (method === "audioExport") {
      const data = Buffer.from(args.data, "base64");
      if (data.length > 8 * 1024 * 1024) throw new Error("Audio too large");
      const ext = args.mimeType.includes("mp4")
        ? "m4a"
        : args.mimeType.includes("ogg")
          ? "ogg"
          : "webm";
      const chosen = await dialog.showSaveDialog(window, {
        title: "Save audio recording",
        defaultPath: `recording.${ext}`,
        filters: [{ name: "Audio recording", extensions: [ext] }],
      });
      if (chosen.canceled || !chosen.filePath)
        return {
          ok: false,
          code: "CANCELLED",
          message: "Audio save cancelled",
        };
      await fs.writeFile(chosen.filePath, data);
      value = { saved: true, bytes: data.length };
    }
    if (method === "device")
      value = {
        platform: { win32: "windows", darwin: "macos", linux: "linux" }[
          process.platform
        ],
        runtime: process.versions,
        arch: process.arch,
        version: config.version,
      };
    if (method === "capabilities")
      value = {
        notifications: capability(
          Notification.isSupported(),
          "OS notification settings may deny display.",
        ),
        clipboard: capability(true),
        files: capability(
          true,
          "Main-process native file dialog; metadata only.",
        ),
        haptics: capability(false, "Desktop haptics are unavailable."),
        share: capability(false, "No desktop share integration is configured."),
        network: capability(true),
        device: capability(true),
      };
    if (method === "clipboard") {
      clipboard.writeText(args.text);
      value = { copied: true };
    }
    if (method === "files") {
      const result = await dialog.showOpenDialog(window, {
        properties: ["openFile"],
        title: "Choose a file",
      });
      if (result.canceled || !result.filePaths.length)
        return {
          ok: false,
          code: "CANCELLED",
          message: "File selection cancelled",
        };
      const selected = result.filePaths[0];
      const stat = await fs.stat(selected);
      if (!stat.isFile()) throw new Error("Not a file");
      value = {
        name: path.basename(selected),
        size: stat.size,
        type: "unknown",
      };
    }
    if (["haptics", "share"].includes(method))
      return {
        ok: false,
        code: "UNSUPPORTED",
        message: "This capability is unavailable on desktop.",
      };
    if (method === "notifications") {
      if (!Notification.isSupported())
        return {
          ok: false,
          code: "UNSUPPORTED",
          message: "OS notifications unavailable",
        };
      const notification = new Notification({
        title: args.title,
        body: args.body,
      });
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Notification not acknowledged")),
          5000,
        );
        notification.once("show", () => {
          clearTimeout(timeout);
          resolve();
        });
        notification.once("failed", () => {
          clearTimeout(timeout);
          reject(new Error("OS notification rejected"));
        });
        notification.show();
      });
      value = { shown: true };
    }
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      code: "FAILED",
      message:
        "The native operation failed. Check OS permissions and try again.",
    };
  }
}
async function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 360,
    minHeight: 500,
    title: config.name,
    icon: path.join(__dirname, "../resources/generated/icon-512.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (!policy.trusted(url, devUrl)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (policy.externalAllowed(url, config.supportUrl)) shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { label: config.name, submenu: [{ role: "about" }, { role: "quit" }] },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Support",
            click: () => {
              if (policy.externalAllowed(config.supportUrl, config.supportUrl))
                shell.openExternal(config.supportUrl);
            },
          },
        ],
      },
    ]),
  );
  await window.loadURL(devUrl || "app://bundle/index.html");
}
app
  .whenReady()
  .then(async () => {
    session.defaultSession.setPermissionRequestHandler(
      (contents, permission, callback, details) => {
        if (
          !window ||
          !policy.microphoneRequest(
            contents,
            permission,
            details,
            window.webContents,
            devUrl,
          )
        ) {
          callback(false);
          return;
        }
        dialog
          .showMessageBox(window, {
            type: "question",
            title: "Microphone access",
            message: "Allow this app to record a local audio note?",
            detail:
              "Recording starts only from the audio demo and stops when you stop it or leave the screen. No automatic upload.",
            buttons: ["Cancel", "Allow microphone"],
            defaultId: 0,
            cancelId: 0,
          })
          .then(({ response }) => {
            microphoneApproved = response === 1;
            callback(microphoneApproved);
          })
          .catch(() => callback(false));
      },
    );
    session.defaultSession.setPermissionCheckHandler(
      (contents, permission, origin, details) => {
        if (
          !window ||
          contents !== window.webContents ||
          permission !== "media" ||
          details?.mediaType !== "audio" ||
          details.isMainFrame !== true
        )
          return false;
        return (
          microphoneApproved &&
          policy.trusted(contents.getURL(), devUrl) &&
          policy.sameOrigin(origin, contents.getURL())
        );
      },
    );
    session.defaultSession.on("will-download", (event) =>
      event.preventDefault(),
    );
    protocol.handle("app", async (request) => {
      try {
        const file = policy.assetPath(request.url, root);
        const response = await net.fetch(pathToFileURL(file).toString());
        const headers = new Headers(response.headers);
        headers.set("Content-Security-Policy", policy.csp);
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    });
    ipcMain.handle("universal:invoke", invoke);
    await createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch(() => {
    console.error(
      "Desktop startup failed. Verify bundled assets with npm run build.",
    );
    app.exit(1);
  });
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
