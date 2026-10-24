import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { app } from "electron";
import type { NativeWallpaperModule } from "@/types/nativeWallpaper";
import { WALLPAPER_NATIVE_EXPORTS } from "@/lib/wallpaperNativeAbi";

export function resolveNativeWallpaperModulePath() {
  const override = process.env.SCOPIFY_WALLPAPER_MODULE_PATH?.trim();
  if (override) return override;
  const binary = `scopify-wallpaper-helper.${process.platform}-${process.arch}${process.platform === "win32" ? "-msvc" : ""}.node`;
  return app.isPackaged
    ? join(process.resourcesPath, "native", "wallpaper-helper", binary)
    : join(app.getAppPath(), "native", "wallpaper-helper", binary);
}

export function loadNativeWallpaperModule(): NativeWallpaperModule {
  if (process.platform !== "darwin" && process.platform !== "win32") {
    throw new Error("Desktop wallpaper requires Windows or macOS.");
  }
  const modulePath = resolveNativeWallpaperModulePath();
  if (!existsSync(modulePath)) throw new Error(`Native wallpaper module is missing: ${modulePath}`);
  const native = createRequire(import.meta.url)(modulePath) as NativeWallpaperModule;
  for (const name of WALLPAPER_NATIVE_EXPORTS) {
    if (typeof native[name] !== "function")
      throw new Error(`Native wallpaper module is missing ${name}.`);
  }
  return native;
}
