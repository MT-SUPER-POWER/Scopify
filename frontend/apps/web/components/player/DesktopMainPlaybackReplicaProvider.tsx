"use client";

import { useEffect, useState } from "react";

import { PlaybackProjectionProvider } from "@/components/player/PlaybackProjectionProvider";
import { DesktopPlaybackHostSessionClient } from "@/components/player/DesktopPlaybackHostSessionClient";
import { registerDesktopMainPlaybackCommandDispatcher } from "@/lib/playbackHost/desktopMainCommandDispatcher";
import { systemPlaybackClock } from "@/lib/playbackProjection/clock";
import { createElectronPlaybackReplicaTransport } from "@/lib/playbackProjection/electronTransport";
import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import { runtime } from "@/lib/runtime";
import type { WebRuntime } from "@/lib/runtime";
import type { LyricData } from "@/types/lyrics";
import type {
  DesktopMainPlaybackReplicaProviderProps,
  SwappablePlaybackProjectionSource,
} from "@/types/playbackHost";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";

export const DESKTOP_MAIN_REPLICA_CONNECTION_ID = "main-renderer-playback-replica";

/** The desktop dashboard receives the Host's projection and never creates a media graph. */
export function DesktopMainPlaybackReplicaProvider({
  children,
}: DesktopMainPlaybackReplicaProviderProps) {
  const [fallbackReplica] = useState(() => {
    const replica = createPlaybackReplica<LyricData>({ clock: systemPlaybackClock });
    replica.disconnect();
    return replica;
  });
  const [source] = useState(() => createSwappableSource<LyricData>(fallbackReplica));

  useEffect(() => {
    source.replaceSource(fallbackReplica);
    if (!runtime.isDesktop) return;

    const transport = createElectronPlaybackReplicaTransport<LyricData>({
      clock: systemPlaybackClock,
      connectionId: DESKTOP_MAIN_REPLICA_CONNECTION_ID,
      port: runtime.playback,
    });
    source.replaceSource(transport.source);
    const unregisterCommandDispatcher = registerDesktopMainPlaybackCommands(source, runtime);

    return () => {
      unregisterCommandDispatcher();
      source.replaceSource(fallbackReplica);
      transport.close();
    };
  }, [fallbackReplica, source]);

  return (
    <PlaybackProjectionProvider source={source}>
      <DesktopPlaybackHostSessionClient />
      {children}
    </PlaybackProjectionProvider>
  );
}

/**
 * Gives the desktop-only UI command seam the active Main Replica source. The
 * Host is deliberately excluded: it owns an Authority, not a Replica relay.
 */
export function registerDesktopMainPlaybackCommands(
  source: Pick<PlaybackProjectionSource<LyricData>, "dispatch">,
  environment: Pick<WebRuntime, "isDesktop" | "playbackHost">,
): () => void {
  if (!environment.isDesktop || environment.playbackHost.getNonce() !== null)
    return () => undefined;
  return registerDesktopMainPlaybackCommandDispatcher((command) => source.dispatch(command));
}

function createSwappableSource<TLyrics>(
  initialSource: PlaybackProjectionSource<TLyrics>,
): SwappablePlaybackProjectionSource<TLyrics> {
  let activeSource = initialSource;
  let unsubscribeActiveSource: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  const subscribeToActiveSource = () => {
    unsubscribeActiveSource?.();
    unsubscribeActiveSource = listeners.size > 0 ? activeSource.subscribe(notify) : null;
  };

  return {
    dispatch: (command) => activeSource.dispatch(command),
    getSnapshot: () => activeSource.getSnapshot(),
    replaceSource(nextSource) {
      if (nextSource === activeSource) return;
      activeSource = nextSource;
      subscribeToActiveSource();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) subscribeToActiveSource();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        unsubscribeActiveSource?.();
        unsubscribeActiveSource = null;
      };
    },
  };
}
