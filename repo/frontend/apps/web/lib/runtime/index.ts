import { createBrowserRuntime } from "./adapters/browser";
import { createElectronRuntime } from "./adapters/electron";
import { createPlaybackHostRuntime } from "./adapters/playbackHost";

export type * from "./types";

/** Composition root: the only Web module allowed to discover the preload bridge. */
export function createRuntimeForWindow(
  rendererWindow: Pick<Window, "electronAPI" | "playbackHostAPI"> | undefined,
) {
  if (rendererWindow?.electronAPI) return createElectronRuntime(rendererWindow.electronAPI);
  if (rendererWindow?.playbackHostAPI)
    return createPlaybackHostRuntime(rendererWindow.playbackHostAPI);
  return createBrowserRuntime();
}

export const runtime = createRuntimeForWindow(typeof window === "undefined" ? undefined : window);
