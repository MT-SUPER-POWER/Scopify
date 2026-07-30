import { createBrowserRuntime } from "./adapters/browser";
import { createElectronRuntime } from "./adapters/electron";

export type * from "./types";

/** Composition root: the only Web module allowed to discover the preload bridge. */
export const runtime =
  typeof window !== "undefined" && window.electronAPI
    ? createElectronRuntime(window.electronAPI)
    : createBrowserRuntime();
