import { loadConfig } from "./config.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { cli, option, run } from "./lib.mjs";
cli(() => {
  if (process.argv.includes("--help")) {
    console.log(
      "setup [--project-id UUID --new-project] initializes non-secret provenance and synchronizes branding metadata. Use the UUID option only when starting a new client project; repeat with the same UUID is idempotent. No source tree creation/update CLI is included.",
    );
    return;
  }
  loadConfig();
  const id = option("project-id");
  if (id) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new Error("Use a version-4 UUID.");
    const metadata = JSON.parse(readFileSync(".universal-app.json"));
    if (metadata.projectId !== id && !process.argv.includes("--new-project"))
      throw new Error(
        "Changing project provenance requires --new-project. It does not rename native IDs or move signing assets.",
      );
    metadata.projectId = id;
    writeFileSync(
      ".universal-app.json",
      JSON.stringify(metadata, null, 2) + "\n",
    );
  }
  run("npm", ["run", "config:sync"]);
  run("npm", ["run", "icons:generate"]);
  run("npm", ["run", "licenses:generate"]);
  console.log("Setup complete; review git diff and run doctor/check.");
});
