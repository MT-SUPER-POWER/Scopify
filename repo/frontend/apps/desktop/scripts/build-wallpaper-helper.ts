import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { runNapiBuild } from "../lib/napiBuild";
import { WALLPAPER_NATIVE_EXPORTS } from "../lib/wallpaperNativeAbi";

if (process.platform !== "win32" && process.platform !== "darwin") process.exit(0);

const helperRoot = join(import.meta.dir, "..", "native", "wallpaper-helper");
const architectures = process.argv.includes("--all-arch")
  ? (["arm64", "x64"] as const)
  : [process.arch];

for (const arch of architectures) {
  if (arch !== "arm64" && arch !== "x64")
    throw new Error(`Unsupported wallpaper architecture: ${arch}`);
  const target = `${arch === "arm64" ? "aarch64" : "x86_64"}-${process.platform === "darwin" ? "apple-darwin" : "pc-windows-msvc"}`;
  const status = runNapiBuild({
    crateRoot: helperRoot,
    cwd: join(import.meta.dir, ".."),
    args: ["--platform", "--release", "--target", target, "--cwd", helperRoot],
  });
  if (status !== 0) process.exit(status);
  const binaryPath = join(
    helperRoot,
    `scopify-wallpaper-helper.${process.platform}-${arch}${process.platform === "win32" ? "-msvc" : ""}.node`,
  );
  if (!existsSync(binaryPath)) throw new Error(`NAPI completed without producing ${binaryPath}`);
  // Only load the host architecture; cross-built artifacts cannot be loaded into this process.
  if (arch === process.arch) {
    const native = createRequire(import.meta.url)(binaryPath) as Record<string, unknown>;
    for (const name of WALLPAPER_NATIVE_EXPORTS) {
      if (typeof native[name] !== "function")
        throw new Error(`Native wallpaper module is missing ${name}`);
    }
  }
}
