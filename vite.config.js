import { defineConfig } from "vite";
import config from "./universal-app.config.json" with { type: "json" };
import { validateConfig } from "./scripts/config.mjs";
validateConfig(config);
import { execFileSync } from "node:child_process";
let commit = "uncommitted";
try {
  commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
} catch {
  /* New template. */
}
export default defineConfig(({ mode }) => {
  const base = mode === "web" ? process.env.WEB_BASE || "/" : "./";
  if (
    mode === "web" &&
    (!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base) || base.includes(".."))
  )
    throw new Error("WEB_BASE must be an absolute path ending in /");
  const channel = process.env.APP_CHANNEL || config.channel;
  if (!["dev", "ci", "beta", "production"].includes(channel))
    throw new Error("Invalid APP_CHANNEL");
  return {
    base,
    build: {
      outDir: mode === "web" ? "dist/web" : "dist/native",
      emptyOutDir: true,
    },
    define: {
      __BUILD__: JSON.stringify({
        version: config.version,
        channel,
        commit,
        androidBuildNumber: config.androidVersionCode,
        iosBuildNumber: config.iosBuildNumber,
        targets: config.targets,
        supportUrl: config.supportUrl,
        name: config.name,
      }),
    },
    plugins: [
      {
        name: "public-branding",
        transformIndexHtml(html) {
          const name = config.name
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
          return html
            .replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`)
            .replace(
              /(name="theme-color"\s+content=")[^"]*(")/,
              (_match, prefix, suffix) =>
                prefix + config.theme.primary + suffix,
            );
        },
      },
      {
        name: "development-csp",
        transformIndexHtml(html, context) {
          return context.server
            ? html
                .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
                .replace("connect-src 'self'", "connect-src 'self' ws: wss:")
            : html;
        },
      },
      {
        name: "app-manifest",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "manifest.webmanifest",
            source: JSON.stringify({
              name: config.name,
              short_name: config.shortName,
              start_url: ".",
              scope: ".",
              display: "standalone",
              background_color: config.theme.background,
              theme_color: config.theme.primary,
              icons: [
                { src: "icon-192.png", sizes: "192x192", type: "image/png" },
                { src: "icon-512.png", sizes: "512x512", type: "image/png" },
                {
                  src: "icon.svg",
                  sizes: "any",
                  type: "image/svg+xml",
                  purpose: "any",
                },
              ],
            }),
          });
        },
      },
    ],
    server: {
      strictPort: true,
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem,key,p12,pfx,jks,keystore,mobileprovision}",
          "**/.git/**",
        ],
      },
      watch: {
        ignored: [
          "**/android/**",
          "**/ios/**",
          "**/artifacts/**",
          "**/dist/**",
        ],
      },
    },
  };
});
