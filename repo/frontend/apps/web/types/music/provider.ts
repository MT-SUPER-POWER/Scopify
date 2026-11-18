import type { MusicProvider } from "@scopify/music-domain/identity";

/** Which platform the app talks to. Switching accounts switches it; the two never mix. */
export interface ActiveProviderStore {
  activeProvider: MusicProvider;
  setActiveProvider: (provider: MusicProvider) => void;
}

/** What a platform switch does, step by step; the switch runs them in a fixed order. */
export interface ProviderSwitchSteps {
  getActiveProvider: () => MusicProvider;
  stopPlayback: () => void;
  clearCaches: () => Promise<void>;
  goHome: () => void;
  setActiveProvider: (provider: MusicProvider) => void;
}
