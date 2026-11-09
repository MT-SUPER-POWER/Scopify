import { accountTrackStateKey } from "@scopify/music-domain/library";
import type { MusicAccountRef, MusicResourceRef } from "@scopify/music-domain/identity";
import type { DemoPersonalStates } from "@/types/provider-demo";

/** This local demo mutation intentionally cannot call a provider or write persistent assets. */
export function toggleDemoTrackLike(
  states: DemoPersonalStates,
  account: MusicAccountRef,
  track: MusicResourceRef<"track">,
): DemoPersonalStates {
  if (account.provider !== track.provider) return states;
  const key = accountTrackStateKey(account, track);
  return { ...states, [key]: { account, track, liked: !states[key]?.liked } };
}
