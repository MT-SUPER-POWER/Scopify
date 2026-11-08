import type { MusicCapability } from "@scopify/music-domain/capability";
import type { MusicProviderClient } from "@scopify/music-domain/provider";

import { qqPlaybackSource } from "@/lib/providers/qq/playback";
import { qqTrackSource } from "@/lib/providers/qq/track";

/** Grows as each area is migrated; a capability is declared once its pages work on QQ. */
const QQ_CAPABILITIES: ReadonlySet<MusicCapability> = new Set<MusicCapability>(["track.read"]);

/** Composed from one module per area (`./<area>.ts`), so areas can change independently. */
export const qqProvider: MusicProviderClient = {
  provider: "qq",
  capabilities: QQ_CAPABILITIES,
  ...qqTrackSource,
  ...qqPlaybackSource,
};
