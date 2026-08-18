import { createBrowserRuntime } from "./adapters/browser";
import { createElectronRuntime } from "./adapters/electron";
import {
  getMusicSessionCredential,
  saveMusicSessionCredential,
} from "@/lib/web/musicSessionCredential";

export type * from "./types";

/** Composition root: the only Web module allowed to discover the preload bridge. */
export function createRuntimeForWindow(rendererWindow: Pick<Window, "electronAPI"> | undefined) {
  if (rendererWindow?.electronAPI) return createElectronRuntime(rendererWindow.electronAPI);
  return createBrowserRuntime();
}

const runtime = createRuntimeForWindow(typeof window === "undefined" ? undefined : window);
if (typeof window !== "undefined") {
  getMusicSessionCredential();

  const electronCookie = window.electronAPI?.getMusicCookie?.();
  if (
    !getMusicSessionCredential() &&
    typeof electronCookie === "string" &&
    electronCookie.length > 0
  ) {
    saveMusicSessionCredential(electronCookie);
  }
}

export { runtime };
