// Sync the approved, existing Ivory artwork without redrawing it.
// Run from the workspace root: node scripts/sync-ivory-brand.mjs
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const kit = "repo/frontend/apps/web/public/brand-kits/ivory";
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
