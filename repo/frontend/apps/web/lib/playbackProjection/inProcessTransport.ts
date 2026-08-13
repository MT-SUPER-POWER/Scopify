import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackMessage,
} from "@scopifymusicplayer/desktop-contract";

import type {
  InProcessPlaybackTransport,
  InProcessPlaybackTransportOptions,
  InProcessProjectionConnection,
  PlaybackAuthorityBinding,
} from "@/types/playbackAuthority";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";

const unavailableReceipt = (command: PlaybackCommand, reason: string): PlaybackCommandReceipt => ({
  commandId: command.commandId,
  reason,
  status: "unavailable",
});

export function createInProcessPlaybackTransport<TLyrics = unknown>(
  options: InProcessPlaybackTransportOptions = {},
): InProcessPlaybackTransport<TLyrics> {
  let authority: PlaybackAuthorityBinding | null = null;
  const receivers = new Set<(message: PlaybackMessage<TLyrics>) => void>();

  const publish = (message: PlaybackMessage<TLyrics>) => {
    let firstDeliveryError: unknown;
    for (const receive of [...receivers]) {
      try {
        receive(message);
      } catch (error) {
        firstDeliveryError ??= error;
        options.onDeliveryError?.(error);
      }
    }

    if (firstDeliveryError !== undefined && !options.onDeliveryError) {
      throw firstDeliveryError;
    }
  };

  const connectAuthority = (binding: PlaybackAuthorityBinding) => {
    if (authority) {
      throw new Error("An in-process playback transport can have only one active Authority");
    }

    authority = binding;
    binding.requestBootstrap();
    let connected = true;

    return () => {
      if (!connected) return;
      connected = false;
      if (authority === binding) authority = null;
    };
  };

  const connectProjection = (
    source: PlaybackProjectionSource<TLyrics>,
    receive: (message: PlaybackMessage<TLyrics>) => void,
  ): InProcessProjectionConnection<TLyrics> => {
    let connected = true;
    receivers.add(receive);

    try {
      authority?.requestBootstrap();
    } catch (error) {
      receivers.delete(receive);
      throw error;
    }

    return {
      disconnect: () => {
        if (!connected) return;
        connected = false;
        receivers.delete(receive);
      },
      dispatch: (command) => {
        if (!connected) {
          return Promise.resolve(unavailableReceipt(command, "projection-disconnected"));
        }
        if (!authority) {
          return Promise.resolve(unavailableReceipt(command, "authority-disconnected"));
        }
        return authority.dispatch(command);
      },
      getSnapshot: () => source.getSnapshot(),
      subscribe: (listener) => source.subscribe(listener),
    };
  };

  return {
    connectAuthority,
    connectProjection,
    publish,
  };
}
