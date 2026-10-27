import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
/** Match only this version/channel/host architecture; never relabel stale packages. */
export function desktopArtifactMatches(
  file,
  config,
  { channel, os = process.platform, arch = process.arch } = {},
) {
  const token = { linux: "linux", darwin: "mac", win32: "win" }[os];
  const prefix = `${config.name}-${config.version}-${token}-`;
  if (!file.startsWith(prefix)) return false;
  const match = file
    .slice(prefix.length)
    .match(/^(.+)-(dev|ci|beta|production)\.(exe|dmg|zip|AppImage|deb)$/);
  if (!match || (channel && match[2] !== channel)) return false;
  return (
    { x64: ["x64", "x86_64", "amd64"], arm64: ["arm64", "aarch64"] }[arch] || [
      arch,
    ]
  ).includes(match[1]);
}
export function verifyChecksums(root) {
  let count = 0;
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === "SHA256SUMS") {
        for (const line of readFileSync(path, "utf8").trim().split("\n")) {
          const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/);
          if (
            !match ||
            basename(match[2]) !== match[2] ||
            match[2].includes("..")
          )
            throw new Error("Invalid artifact checksum manifest");
          const digest = createHash("sha256")
            .update(readFileSync(join(dir, match[2])))
            .digest("hex");
          if (digest !== match[1])
            throw new Error("Artifact checksum mismatch");
          count++;
        }
      }
    }
  }
  walk(root);
  if (!count) throw new Error("No artifact checksums found");
  return count;
}
