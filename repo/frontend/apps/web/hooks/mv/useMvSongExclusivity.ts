"use client";

import { useEffect, useRef } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";

/**
 * MV 与歌曲互斥发声：MV 开始播放时暂停歌曲；用户从播放栏继续放歌时暂停 MV。
 * 只响应歌曲「暂停 → 播放」的变化，避免挂载时把正在播放的歌误判为切回。
 */
export function useMvSongExclusivity() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const commands = usePlaybackCommands();
  const isSongPlaying = usePlaybackProjection().isPlaying;
  const isSongPlayingRef = useRef(isSongPlaying);

  useEffect(() => {
    if (!isSongPlayingRef.current && isSongPlaying) videoRef.current?.pause();
    isSongPlayingRef.current = isSongPlaying;
  }, [isSongPlaying]);

  const handleVideoPlay = () => {
    if (isSongPlayingRef.current) void commands.pause();
  };

  return { videoRef, handleVideoPlay };
}
