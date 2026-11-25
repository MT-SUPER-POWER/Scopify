"use client";

import { useEffect, useRef } from "react";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { usePlayerStore } from "@/store/module/player";
import { useScratchpadStore } from "@/store/module/scratchpad";

/**
 * 订阅播放器当前曲目与会话版本号，将每一次切歌/起播同步记录到本地播放历史。
 */
export function useTrackLocalHistory() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const sessionRevision = usePlayerStore((state) => state.playbackSessionRevision);
  const lastRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    const signature = `${sessionRevision}:${playerTrackKey(currentTrack)}`;
    if (lastRecordedRef.current === signature) return;
    lastRecordedRef.current = signature;
    useScratchpadStore.getState().recordHistory(currentTrack);
  }, [currentTrack, sessionRevision]);
}
