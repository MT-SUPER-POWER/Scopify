import { createBrowserRuntime } from "./adapters/browser";
import { createElectronRuntime } from "./adapters/electron";

export type * from "./types";

/** Composition root: the only Web module allowed to discover the preload bridge. */
export function createRuntimeForWindow(rendererWindow: Pick<Window, "electronAPI"> | undefined) {
  if (rendererWindow?.electronAPI) return createElectronRuntime(rendererWindow.electronAPI);
  return createBrowserRuntime();
}

const runtime = createRuntimeForWindow(typeof window === "undefined" ? undefined : window);

export { runtime };
