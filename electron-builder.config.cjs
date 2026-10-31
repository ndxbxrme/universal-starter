const app = require("./universal-app.config.json");
module.exports = {
  appId: app.appId,
  productName: app.name,
  asar: true,
  directories: { output: "artifacts/desktop" },
  files: [
    "dist/native/**",
    "electron/**",
    "universal-app.config.json",
    "package.json",
    "LICENSE",
  ],
  extraMetadata: { main: "electron/main.cjs", version: app.version },
  artifactName:
    "${productName}-${version}-${os}-${arch}-" +
    (process.env.APP_CHANNEL || app.channel) +
    ".${ext}",
  publish: null,
  win: { target: ["nsis"], icon: "resources/generated/icon.ico" },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
  mac: {
    target: ["dmg", "zip"],
    icon: "resources/generated/icon.icns",
    hardenedRuntime: true,
    extendInfo: {
      NSMicrophoneUsageDescription:
        "Record a local audio note only when you press Start recording.",
    },
    entitlements: "resources/entitlements.mac.plist",
    entitlementsInherit: "resources/entitlements.mac.plist",
    notarize:
      process.env.DESKTOP_SIGN === "1" && process.env.DESKTOP_NOTARIZE === "1",
  },
  linux: {
    target: ["AppImage", "deb"],
    icon: "resources/generated/icon-512.png",
    category: "Development",
    syncDesktopName: true,
    maintainer: "Universal Starter contributors",
  },
  forceCodeSigning: process.env.DESKTOP_SIGN === "1",
};
