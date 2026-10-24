import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { app, screen } from "electron";

import type {
  NativeWallpaperHost,
  NativeWallpaperHostOptions,
  NativeWallpaperModule,
  NativeWallpaperSession,
} from "@/types/nativeWallpaper";
import { createNativeWallpaperSession } from "./nativeWallpaperSession";

export type {
  NativeWallpaperHost,
  NativeWallpaperAttachment,
  NativeWallpaperHostOptions,
} from "@/types/nativeWallpaper";

/** Both platforms load the same Rust crate and use the same Node-API transport. */
export function createNativeWallpaperHost(
  options: NativeWallpaperHostOptions = {},
): NativeWallpaperHost {
  let session: NativeWallpaperSession | null = null;
  return {
    attach(window, signal) {
      session ??= createNativeWallpaperSession(loadNativeWallpaperModule(), options);
      const bounds = screen.getDisplayMatching(window.getBounds()).bounds;
      return session.attach(
        window.getNativeWindowHandle(),
        bounds,
        screen.getPrimaryDisplay().bounds.height,
        signal,
      );
    },
    detach: () => session?.detach() ?? Promise.resolve(true),
    dispose: async () => {
      await session?.dispose();
    },
    isAttached: () => session?.isAttached() ?? false,
  };
}

export function resolveNativeWallpaperModulePath() {
  const override = process.env.SCOPIFY_WALLPAPER_MODULE_PATH?.trim();
  if (override) return override;
  const binary = `scopify-wallpaper-helper.${process.platform}-${process.arch}${process.platform === "win32" ? "-msvc" : ""}.node`;
  return app.isPackaged
    ? join(process.resourcesPath, "native", "wallpaper-helper", binary)
    : join(app.getAppPath(), "native", "wallpaper-helper", binary);
}

function loadNativeWallpaperModule(): NativeWallpaperModule {
  if (process.platform !== "darwin" && process.platform !== "win32") {
    throw new Error("Desktop wallpaper requires Windows or macOS.");
  }
  const modulePath = resolveNativeWallpaperModulePath();
  if (!existsSync(modulePath)) throw new Error(`Native wallpaper module is missing: ${modulePath}`);
  const native = createRequire(import.meta.url)(modulePath) as NativeWallpaperModule;
  for (const name of ["attach", "detach", "pollEvents", "isAttached"] as const) {
    if (typeof native[name] !== "function")
      throw new Error(`Native wallpaper module is missing ${name}.`);
  }
  return native;
}
