import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { run, cli, option } from "./lib.mjs";
cli(async () => {
  if (process.platform === "win32")
    throw new Error(
      "Use a supported Unix Maestro CLI host or WSL; see docs/testing.md.",
    );
  const dir = option(
    "dir",
    join(
      process.env.RUNNER_TEMP || process.env.XDG_CACHE_HOME || "/tmp",
      "universal-maestro-2.12.0",
    ),
  );
  await mkdir(dir, { recursive: true });
  const response = await fetch(
    "https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.0/maestro.zip",
  );
  if (!response.ok) throw new Error("Maestro download failed");
  const data = Buffer.from(await response.arrayBuffer());
  if (
    createHash("sha256").update(data).digest("hex") !==
    "a6044a84542f522f434c5dc3d609e60c7446d423f3ed1b2ae513f5c48663ec5e"
  )
    throw new Error("Maestro checksum mismatch");
  const zip = join(dir, "maestro.zip");
  await writeFile(zip, data);
  run("unzip", ["-qo", zip, "-d", dir]);
  const bin = join(dir, "maestro", "bin");
  if (process.env.GITHUB_PATH) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_PATH, bin + "\n");
  }
  console.log("Verified Maestro 2.12.0 installed; add to PATH:", bin);
});
