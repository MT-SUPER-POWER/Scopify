import type { MusicProvider } from "@scopify/music-domain/identity";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { neteaseProvider } from "@/lib/providers/netease";
import { qqProvider } from "@/lib/providers/qq";

/** Platforms by name; the active one is chosen by the provider store. */
export const MUSIC_PROVIDERS: Readonly<Record<MusicProvider, MusicProviderClient>> = {
  netease: neteaseProvider,
  qq: qqProvider,
};

export function getMusicProvider(provider: MusicProvider): MusicProviderClient {
  return MUSIC_PROVIDERS[provider];
}
