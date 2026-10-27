import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { run, option, cli } from "./lib.mjs";
cli(() => {
  if (process.argv[2] === "check") {
    const result = spawnSync("npm", ["outdated"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.error || result.status > 1)
      throw new Error("Cannot query dependency registry");
    run("npm", ["audit", "--audit-level=moderate"]);
    return;
  }
  const name = option("package"),
    version = option("version");
  if (
    !/^(@[a-z0-9-]+\/)?[a-z0-9.-]+$/.test(name || "") ||
    !/^\d+\.\d+\.\d+$/.test(version || "")
  )
    throw new Error(
      "Guided update: pass --package NAME --version X.Y.Z [--dry-run|--apply] [--allow-major]. See docs/commands.md.",
    );
  const pkg = JSON.parse(readFileSync("package.json"));
  const current = pkg.dependencies?.[name] || pkg.devDependencies?.[name];
  if (!current) throw new Error("Package is not a direct dependency");
  if (
    current.split(".")[0] !== version.split(".")[0] &&
    !process.argv.includes("--allow-major")
  )
    throw new Error(
      "Major update requires explicit --allow-major and compatibility review.",
    );
  console.log("Update plan:", name, current, "→", version);
  if (!process.argv.includes("--apply")) {
    console.log(
      "Dry run only. Review compatibility, then use --apply and run check/native builds.",
    );
    return;
  }
  run("npm", [
    "install",
    ...(pkg.devDependencies?.[name] ? ["--save-dev"] : ["--save"]),
    "--save-exact",
    `${name}@${version}`,
  ]);
  console.log(
    "Review lockfile diff, run npm run check and affected native builds before committing.",
  );
});
