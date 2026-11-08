import { musicAccountKey, musicResourceKey } from "./identity";
import type { MusicAccountRef, MusicResourceRef } from "./identity";

/** Personal state is separate from shared catalog metadata and always names its owner. */
export interface AccountTrackState {
  account: MusicAccountRef;
  track: MusicResourceRef<"track">;
  liked: boolean;
}

export function accountTrackStateKey(
  account: MusicAccountRef,
  track: MusicResourceRef<"track">,
): string {
  return JSON.stringify([musicAccountKey(account), musicResourceKey(track)]);
}
