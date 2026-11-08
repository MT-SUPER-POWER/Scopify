import type { MusicProvider } from "@scopify/music-domain/identity";

/** Which platform the app talks to. Switching accounts switches it; the two never mix. */
export interface ActiveProviderStore {
  activeProvider: MusicProvider;
  setActiveProvider: (provider: MusicProvider) => void;
}
