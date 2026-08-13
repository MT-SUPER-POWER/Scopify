import type { PlaybackPhase } from "@mt-super-power/desktop-contract";

/**
 * Loading a replacement source can synchronously emit `pause` for the retired
 * media. That is transport noise, not a user intent change for the Host's
 * canonical session.
 */
export function shouldForwardExternalSessionPhase(
  phase: PlaybackPhase,
  isMediaSourceLoading: boolean,
): boolean {
  return phase !== "paused" || !isMediaSourceLoading;
}
