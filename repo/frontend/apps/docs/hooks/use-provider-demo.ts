"use client";

import { useRef, useState } from "react";
import { accountTrackStateKey } from "@scopify/music-domain/library";
import type { MusicProvider } from "@scopify/music-domain/identity";
import type { MusicTrack } from "@scopify/music-domain/track";
import { DEMO_IDENTITIES } from "@/constants/provider-demo";
import { toggleDemoTrackLike } from "@/lib/provider-demo";
import type { DemoQueueItem, DemoPersonalStates } from "@/types/provider-demo";

export function useProviderDemo() {
  const [activeProvider, setActiveProvider] = useState<MusicProvider>("netease");
  const [personalStates, setPersonalStates] = useState<DemoPersonalStates>({});
  const [queue, setQueue] = useState<DemoQueueItem[]>([]);
  const [playingQueueItemId, setPlayingQueueItemId] = useState<number | null>(null);
  const nextQueueItemId = useRef(0);
  const identity = DEMO_IDENTITIES[activeProvider];
  const playingItem = queue.find((item) => item.queueItemId === playingQueueItemId) ?? null;

  const isLiked = (track: MusicTrack) =>
    personalStates[accountTrackStateKey(identity.account, track.ref)]?.liked ?? false;

  const toggleLike = (track: MusicTrack) => {
    const account = identity.account;
    setPersonalStates((current) => toggleDemoTrackLike(current, account, track.ref));
  };

  const enqueue = (track: MusicTrack) => {
    const queueItemId = nextQueueItemId.current++;
    setQueue((current) => [...current, { queueItemId, track }]);
  };

  return {
    identity,
    setActiveProvider,
    isLiked,
    toggleLike,
    enqueue,
    queue,
    playingItem,
    setPlayingQueueItemId,
  };
}
