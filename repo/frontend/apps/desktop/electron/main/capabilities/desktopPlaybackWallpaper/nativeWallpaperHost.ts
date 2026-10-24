import { screen } from "electron";
import { loadNativeWallpaperModule } from "@main/services/nativeWallpaperModule";

import type {
  NativeWallpaperHost,
  NativeWallpaperHostOptions,
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
