"use client";

import { useEffect, useRef, useState } from "react";
import { useSongDynamicCoverQuery } from "@/hooks/song/useSongDynamicCover";
import { resolveDynamicCoverVideoUrl } from "@/lib/music/dynamicCover";
import { cn } from "@/lib/utils";
import type { NowPlayingDynamicCoverProps } from "@/types/components/nowPlaying";

/**
 * 网易云「动态封面」短视频（类似 Spotify Canvas），静音循环叠在静态封面上，
 * 随播放暂停；加载完成前透明，失败或没有动态封面时保持静态封面。
 */
export function NowPlayingDynamicCover({ songId, isPlaying }: NowPlayingDynamicCoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const query = useSongDynamicCoverQuery(songId);
  const videoUrl = resolveDynamicCoverVideoUrl(query.data?.data);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) void video.play().catch(() => undefined);
    else video.pause();
  }, [isPlaying, videoUrl]);

  if (!videoUrl || hasFailed) return null;

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      loop
      playsInline
      autoPlay={isPlaying}
      preload="auto"
      aria-hidden
      onCanPlay={() => setIsReady(true)}
      onError={() => setHasFailed(true)}
      className={cn(
        "absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:hidden",
        isReady ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
