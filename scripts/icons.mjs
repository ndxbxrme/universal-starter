import sharp from "sharp";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
async function png(file, size, source = "resources/icon.svg") {
  await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  await sharp(source).resize(size, size).png().toFile(file);
}
const branding = JSON.parse(await readFile("universal-app.config.json"));
const master = await readFile("resources/icon.svg", "utf8");
const body = master.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
if (!body) throw new Error("Invalid icon SVG master");
const box = master.match(/viewBox="([^"]+)"/)?.[1] || "0 0 512 512";
await writeFile("public/icon.svg", master);
await writeFile(
  "resources/splash.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048"><rect width="2048" height="2048" fill="${branding.theme.darkBackground || "#151722"}"/><svg x="768" y="768" width="512" height="512" viewBox="${box}">${body}</svg></svg>\n`,
);
await mkdir("resources/generated", { recursive: true });
for (const size of [16, 32, 48, 64, 128, 256, 512, 1024])
  await png(`resources/generated/icon-${size}.png`, size);
await png("public/icon-192.png", 192);
await png("public/icon-512.png", 512);
const icon = await readFile("resources/generated/icon-256.png");
const ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = 0;
ico[7] = 0;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(icon.length, 14);
ico.writeUInt32LE(22, 18);
await writeFile("resources/generated/icon.ico", Buffer.concat([ico, icon]));
const large = await readFile("resources/generated/icon-1024.png");
const icns = Buffer.alloc(16);
icns.write("icns");
icns.writeUInt32BE(large.length + 16, 4);
icns.write("ic10", 8);
icns.writeUInt32BE(large.length + 8, 12);
await writeFile("resources/generated/icon.icns", Buffer.concat([icns, large]));
if (existsSync("android/app/src/main/res")) {
  const res = "android/app/src/main/res";
  for (const [density, size] of Object.entries({
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  })) {
    for (const name of ["ic_launcher", "ic_launcher_round"])
      await png(`${res}/mipmap-${density}/${name}.png`, size);
    await png(
      `${res}/mipmap-${density}/ic_launcher_foreground.png`,
      Math.round((size * 108) / 48),
    );
  }
  for (const dir of await readdir(res)) {
    if (dir.startsWith("drawable") && existsSync(`${res}/${dir}/splash.png`)) {
      const metadata = await sharp(`${res}/${dir}/splash.png`).metadata();
      await sharp("resources/splash.svg")
        .resize(metadata.width, metadata.height, { fit: "cover" })
        .png()
        .toFile(`${res}/${dir}/splash-generated.png`);
      const { rename } = await import("node:fs/promises");
      await rename(
        `${res}/${dir}/splash-generated.png`,
        `${res}/${dir}/splash.png`,
      );
    }
  }
}
const ios = "ios/App/App/Assets.xcassets/AppIcon.appiconset";
if (existsSync(ios)) {
  await png(`${ios}/AppIcon-512@2x.png`, 1024);
  await writeFile(
    `${ios}/Contents.json`,
    JSON.stringify(
      {
        images: [
          {
            filename: "AppIcon-512@2x.png",
            idiom: "universal",
            platform: "ios",
            size: "1024x1024",
          },
        ],
        info: { author: "xcode", version: 1 },
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  "Generated web, desktop and available mobile icons from resources/icon.svg; splash from resources/splash.svg. Original MIT artwork.",
);

const iosSplash = "ios/App/App/Assets.xcassets/Splash.imageset";
if (existsSync(iosSplash)) {
  for (const file of await readdir(iosSplash)) {
    if (file.endsWith(".png")) {
      const path = `${iosSplash}/${file}`;
      const meta = await sharp(path).metadata();
      await sharp("resources/splash.svg")
        .resize(meta.width, meta.height, { fit: "cover" })
        .png()
        .toFile(path);
    }
  }
}
