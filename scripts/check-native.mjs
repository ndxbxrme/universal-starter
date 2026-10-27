import { readFileSync } from "node:fs";
import { cli, isMain } from "./lib.mjs";
export function checkNative(target) {
  const base =
    target === "ios"
      ? "ios/App/App"
      : target === "android"
        ? "android/app/src/main/assets"
        : null;
  if (!base) throw new Error("Choose android or ios.");
  const cap = JSON.parse(readFileSync(base + "/capacitor.config.json"));
  if (cap.server)
    throw new Error(
      "Release blocked: development server configuration; run cap:sync.",
    );
  const html = readFileSync(base + "/public/index.html", "utf8");
  if (
    /unsafe-inline|ws:\/\/|\/@vite\/|href="\/[A-Za-z0-9_-]+\/assets/.test(html)
  )
    throw new Error("Release blocked: development/Pages assets detected.");
  console.log("PASS: " + target + " bundles local production-safe SPA assets.");
}
if (isMain(import.meta.url)) cli(() => checkNative(process.argv[2]));
