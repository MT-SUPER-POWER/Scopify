import type { PlaybackMessage } from "@scopify/desktop-contract";

import type {
  InProcessPlaybackTransport,
  PlaybackAuthorityBinding,
} from "@/types/playbackAuthority";
import type { ElectronPlaybackAuthorityTransport } from "@/types/playbackTransport";

/** Fans one Authority out to the local Replica and Electron Broker behind one transport interface. */
export function createCompositePlaybackAuthorityTransport<TLyrics>(
  local: InProcessPlaybackTransport<TLyrics>,
  remote: ElectronPlaybackAuthorityTransport<TLyrics> | null,
): InProcessPlaybackTransport<TLyrics> {
  return {
    connectAuthority(binding: PlaybackAuthorityBinding) {
      const disconnectLocal = local.connectAuthority(binding);
      const disconnectRemote = remote?.connectAuthority(binding) ?? (() => undefined);
      return () => {
        disconnectRemote();
        disconnectLocal();
      };
    },
    connectProjection: local.connectProjection,
    publish(message: PlaybackMessage<TLyrics>) {
      local.publish(message);
      remote?.publish(message);
    },
  };
}
