import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { getMusicProvider } from "@/lib/providers";
import { useActiveProviderStore } from "@/store/module/provider";

/** The platform object for the active account. Hooks call it instead of a platform's API. */
export function useActiveProvider(): MusicProviderClient {
  return getMusicProvider(useActiveProviderStore((state) => state.activeProvider));
}

/** Whether the active platform supports a feature; UI without it is not rendered. */
export function useProviderCapability(capability: MusicCapability): boolean {
  return useActiveProvider().capabilities.has(capability);
}
