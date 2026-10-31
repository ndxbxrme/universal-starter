import {
  readFile,
  writeFile,
  readdir,
  copyFile,
  access,
} from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
const pkg = JSON.parse(await readFile("package.json"));
const packages = new Map();
async function findPackage(name, from) {
  let current = from;
  while (true) {
    const root = join(current, "node_modules", name);
    try {
      await access(join(root, "package.json"));
      return root;
    } catch {
      /* Try Node's parent lookup. */
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
async function visit(name, from, required = true) {
  const root = await findPackage(name, from);
  if (!root) {
    if (required)
      throw new Error(`Missing runtime dependency ${name}; run npm ci.`);
    return;
  }
  const data = JSON.parse(await readFile(join(root, "package.json")));
  const key = `${data.name}@${data.version}`;
  if (packages.has(key)) return;
  packages.set(key, { root, data });
  for (const dependency of Object.keys(data.dependencies || {}))
    await visit(dependency, root);
  for (const dependency of Object.keys({
    ...data.optionalDependencies,
    ...data.peerDependencies,
  }))
    await visit(dependency, root, false);
}
for (const name of Object.keys(pkg.dependencies))
  await visit(name, resolve("."));
let text =
  "THIRD-PARTY NOTICES\n\nInstalled runtime dependencies, including transitive packages. Build/test tools are not shipped as app code. Electron distributions additionally contain LICENSE and LICENSES.chromium.html. Native platform SDK notices remain in their upstream distributions.\n\n";
for (const [key, { root, data }] of [...packages].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  const files = await readdir(root);
  const license = files.find((file) =>
    /^licen[sc]e(?:\.md|\.txt)?$/i.test(file),
  );
  text +=
    `${key} (${data.license || "see license"})\n` +
    (license
      ? await readFile(join(root, license), "utf8")
      : "See the package distribution for its license.") +
    "\n\n";
}
await writeFile("resources/THIRD_PARTY_NOTICES.txt", text);
await copyFile("resources/THIRD_PARTY_NOTICES.txt", "public/licenses.txt");
console.log(
  `Generated notices for ${packages.size} installed runtime packages.`,
);
