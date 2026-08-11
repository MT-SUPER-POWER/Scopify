"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { PlaybackProjectionProvider } from "@/components/player/PlaybackProjectionProvider";
import { getCompanionPlaybackPath } from "@/lib/playbackProjection/companionRoute";
import { systemPlaybackClock } from "@/lib/playbackProjection/clock";
import { createElectronPlaybackReplicaTransport } from "@/lib/playbackProjection/electronTransport";
import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import { runtime } from "@/lib/runtime";
import type { LyricData } from "@/types/lyrics";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";

type SwappablePlaybackSource<TLyrics> = PlaybackProjectionSource<TLyrics> & {
  replaceSource(source: PlaybackProjectionSource<TLyrics>): void;
};

/** Installs one Electron Replica only for companion routes; dashboard owns a nested local Replica. */
export function CompanionPlaybackProjectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const companionPath = getCompanionPlaybackPath(pathname);
  const isCompanionRoute = companionPath !== null;
  const [fallbackReplica] = useState(() => {
    const replica = createPlaybackReplica<LyricData>({ clock: systemPlaybackClock });
    replica.disconnect();
    return replica;
  });
  const [source] = useState(() => createSwappableSource<LyricData>(fallbackReplica));

  useEffect(() => {
    source.replaceSource(fallbackReplica);
    if (!isCompanionRoute || !runtime.isDesktop) return;

    const transport = createElectronPlaybackReplicaTransport<LyricData>({
      clock: systemPlaybackClock,
      connectionId: `companion-renderer:${companionPath}`,
      port: runtime.playback,
    });
    source.replaceSource(transport.source);

    return () => {
      source.replaceSource(fallbackReplica);
      transport.close();
    };
  }, [companionPath, fallbackReplica, isCompanionRoute, source]);

  if (!isCompanionRoute) return children;
  return <PlaybackProjectionProvider source={source}>{children}</PlaybackProjectionProvider>;
}

function createSwappableSource<TLyrics>(
  initialSource: PlaybackProjectionSource<TLyrics>,
): SwappablePlaybackSource<TLyrics> {
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
