const path = require("node:path");
const { realpathSync } = require("node:fs");
const methods = new Set([
  "device",
  "capabilities",
  "notifications",
  "clipboard",
  "files",
  "haptics",
  "share",
]);
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
function trusted(url, devUrl) {
  try {
    const parsed = new URL(url);
    return devUrl
      ? parsed.origin === new URL(devUrl).origin && parsed.pathname === "/"
      : parsed.protocol === "app:" &&
          parsed.host === "bundle" &&
          parsed.pathname === "/index.html";
  } catch {
    return false;
  }
}
function externalAllowed(url, supportUrl) {
  try {
    const parsed = new URL(url);
    const support = new URL(supportUrl);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      parsed.origin === support.origin &&
      parsed.pathname === support.pathname
    );
  } catch {
    return false;
  }
}
function assetPath(url, root) {
  const parsed = new URL(url);
  if (parsed.protocol !== "app:" || parsed.host !== "bundle")
    throw new Error("Untrusted asset origin");
  const file = realpathSync(
    path.resolve(root, "." + decodeURIComponent(parsed.pathname)),
  );
  const relative = path.relative(realpathSync(root), file);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Asset path denied");
  return file;
}
function validate(method, args) {
  if (!methods.has(method)) throw new Error("Unknown method");
  if (
    ["device", "capabilities", "files", "haptics", "share"].includes(method)
  ) {
    if (args !== undefined) throw new Error("Unexpected arguments");
    return;
  }
  if (!args || typeof args !== "object" || Array.isArray(args))
    throw new Error("Expected object");
  const keys = Object.keys(args);
  if (method === "clipboard") {
    if (
      keys.length !== 1 ||
      typeof args.text !== "string" ||
      args.text.length > 100000
    )
      throw new Error("Invalid clipboard text");
  }
  if (method === "notifications") {
    if (
      keys.length !== 2 ||
      !keys.includes("title") ||
      !keys.includes("body") ||
      typeof args.title !== "string" ||
      typeof args.body !== "string" ||
      !args.title.trim() ||
      args.title.length > 128 ||
      args.body.length > 2000
    )
      throw new Error("Invalid notification");
  }
}
module.exports = { trusted, externalAllowed, assetPath, validate, csp };
