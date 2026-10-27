import { readFile, writeFile, readdir, copyFile } from "node:fs/promises";
const pkg = JSON.parse(await readFile("package.json"));
let text =
  "THIRD-PARTY NOTICES\n\nThe app includes the following runtime dependencies. Build/test tools are not shipped as app code. Electron distributions additionally contain LICENSE and LICENSES.chromium.html.\n\n";
for (const name of Object.keys(pkg.dependencies).sort()) {
  const root = "node_modules/" + name;
  const data = JSON.parse(await readFile(root + "/package.json"));
  const files = await readdir(root);
  const license = files.find((file) =>
    /^licen[sc]e(?:\.md|\.txt)?$/i.test(file),
  );
  text +=
    `${name} ${data.version} (${data.license || "see license"})\n` +
    (license
      ? await readFile(root + "/" + license, "utf8")
      : "See the package distribution for its license.") +
    "\n\n";
}
await writeFile("resources/THIRD_PARTY_NOTICES.txt", text);
await copyFile("resources/THIRD_PARTY_NOTICES.txt", "public/licenses.txt");
console.log("Generated runtime dependency license notices.");
