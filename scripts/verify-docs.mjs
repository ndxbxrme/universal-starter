import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { cli } from "./lib.mjs";
cli(async () => {
  const pkg = JSON.parse(await readFile("package.json"));
  const spec = await readFile("CODEX_PROJECT_SPEC.md", "utf8");
  const required = [
    ...spec
      .split("## 8. NPM command contract")[1]
      .split("## 9.")[0]
      .matchAll(/`npm run ([^`]+)`/g),
  ].map((match) => match[1]);
  for (const name of required)
    if (!pkg.scripts[name])
      throw new Error("Required npm script missing: " + name);
  const reference = await readFile("docs/commands.md", "utf8");
  for (const name of Object.keys(pkg.scripts))
    if (!reference.includes("npm run " + name + "`"))
      throw new Error("Npm script missing from command reference: " + name);
  const files = [
    "README.md",
    "CONTRIBUTING.md",
    ...(await readdir("docs"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => "docs/" + file),
  ];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g))
      if (!pkg.scripts[match[1]])
        throw new Error(
          "Undocumented implementation: " + match[1] + " in " + file,
        );
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(?:https?:|#|mailto:)/.test(link)) continue;
      const path = resolve(dirname(file), link.split("#")[0]);
      if (!existsSync(path))
        throw new Error(
          "Broken local documentation link in " + file + ": " + link,
        );
    }
  }
  console.log(
    "PASS: all " +
      required.length +
      " specified scripts exist; documentation commands and local links resolve.",
  );
});
