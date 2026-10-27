import { build, preview } from "vite";
process.env.WEB_BASE = "/starter-test/";
await build({ mode: "web" });
await preview({
  mode: "web",
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
