import type { TemperaPoolBusyAction } from "@/types/lyrics/folia/temperaImagePool";

/**
 * Whether the run in flight is one a close would corrupt (Folia 2bd16cbc). `exporting` only
 * reads the draft; `adding` and `importing` write it after their last await, so a close in
 * between would commit the pre-run pool and strand the tail in the asset store.
 */
export const isTemperaPoolWriteLocked = (busy: TemperaPoolBusyAction) =>
  busy === "adding" || busy === "importing";
