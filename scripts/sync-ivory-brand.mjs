// Sync the approved, existing Ivory artwork without redrawing it.
// Add --resize-icons to regenerate icon frames with less transparent padding.
// icon-master.png remains the original artwork, so regeneration is repeatable.
// Run from the workspace root: node scripts/sync-ivory-brand.mjs
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kit = "repo/frontend/apps/web/public/brand-kits/ivory";

async function resizeIcons() {
  const packages = await readdir(resolve(root, "node_modules/.pnpm"));
  const sharpPackage = packages.find((name) => name.startsWith("sharp@"));
  if (!sharpPackage) throw new Error("Install workspace dependencies before resizing icons.");
  const require = createRequire(import.meta.url);
  const sharp = require(resolve(root, "node_modules/.pnpm", sharpPackage, "node_modules/sharp"));
  const source = await readFile(resolve(root, kit, "icon-master.png"));
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let top = info.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("Ivory icon artwork is empty.");
  const artwork = await sharp(source)
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .png()
    .toBuffer();
  const frames = new Map();
  for (const size of [16, 24, 32, 48, 64, 128, 180, 256, 512, 1024]) {
    const padding = Math.round(size * 0.01);
    const png = await sharp(artwork)
      .resize(size - padding * 2, size - padding * 2, { fit: "contain", background: "#00000000" })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: "#00000000",
      })
      .png()
      .toBuffer();
    frames.set(size, png);
    await writeFile(
      resolve(root, kit, size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`),
      png,
    );
  }
  // Store PNG-compressed frames in the native Windows ICO directory.
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  for (const [index, size] of sizes.entries()) {
    const png = frames.get(size);
    const at = 6 + index * 16;
    header[at] = size % 256;
    header[at + 1] = size % 256;
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(png.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += png.length;
  }
  await writeFile(
    resolve(root, kit, "icon.ico"),
    Buffer.concat([header, ...sizes.map((size) => frames.get(size))]),
  );
  const chunks = [];
  for (const [type, size] of [
    ["ic07", 128],
    ["ic08", 256],
    ["ic09", 512],
    ["ic10", 1024],
  ]) {
    const png = frames.get(size);
    const chunk = Buffer.alloc(8);
    chunk.write(type);
    chunk.writeUInt32BE(png.length + 8, 4);
    chunks.push(chunk, png);
  }
  const icnsHeader = Buffer.alloc(8);
  icnsHeader.write("icns");
  icnsHeader.writeUInt32BE(8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0), 4);
  await writeFile(resolve(root, kit, "icon.icns"), Buffer.concat([icnsHeader, ...chunks]));
}

if (process.argv.includes("--resize-icons")) await resizeIcons();

async function copy(source, destination) {
  const target = resolve(root, destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, kit, source), target);
}

for (const target of [
  "repo/frontend/apps/web/app/favicon.ico",
  "repo/frontend/apps/web/public/icon.ico",
  "repo/frontend/apps/docs/public/favicon.ico",
  "repo/frontend/apps/desktop/public/icons/icon.ico",
  "repo/frontend/apps/desktop/public/icons/uninstall.ico",
  "docs/img/icon.ico",
]) {
  await copy("icon.ico", target);
}
await copy("icon.icns", "repo/frontend/apps/desktop/public/icons/icon.icns");
await copy("icon-256.png", "repo/frontend/apps/desktop/public/icons/uninstall.png");
await copy("icon-32.png", "repo/frontend/apps/desktop/public/icons/tray/icon_32x32.png");
for (const size of [16, 32, 128, 256, 512]) {
  await copy(
    `icon-${size}.png`,
    `repo/frontend/apps/desktop/public/icons/icon.iconset/icon_${size}x${size}.png`,
  );
  await copy(
    `icon-${size * 2}.png`,
    `repo/frontend/apps/desktop/public/icons/icon.iconset/icon_${size}x${size}@2x.png`,
  );
}
for (const target of ["repo/frontend/apps/docs/assets/logo.png", "docs/img/logo.png"]) {
  await copy("icon-256.png", target);
}
await copy("apple-touch-icon.png", "repo/frontend/apps/docs/assets/apple-touch-icon.png");
for (const tone of ["light", "dark"]) {
  await copy(`wordmark-on-${tone}.png`, `repo/frontend/apps/docs/assets/wordmark-on-${tone}.png`);
  await copy(`wordmark-on-${tone}.png`, `docs/img/wordmark${tone === "dark" ? "-light" : ""}.png`);
}
console.log("Approved Ivory brand synced to Web, desktop, docs and README.");
