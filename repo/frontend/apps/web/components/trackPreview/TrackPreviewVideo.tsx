"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { useMvSongExclusivity } from "@/hooks/mv/useMvSongExclusivity";
import type { TrackPreviewVideoProps } from "@/types/player/trackPreviewComponents";

const PREVIEW_RESOLUTION = 720;
/** 从 MV 的这个位置起播，跳过片头，接近副歌。 */
const PREVIEW_START_RATIO = 0.25;

/** 预览弹窗中央的 MV：自动从中段起播；有声播放时暂停正在播放的歌曲，播完交给外层切到下一首。 */
export function TrackPreviewVideo({ mvId, muted, onProgress, onEnded }: TrackPreviewVideoProps) {
  const urlQuery = useMVUrlQuery(mvId, PREVIEW_RESOLUTION);
  const url = urlQuery.data?.data?.url ?? null;
  const { videoRef, handleVideoPlay } = useMvSongExclusivity();

  // 取消静音时才和歌曲抢声音
  useEffect(() => {
    const video = videoRef.current;
    if (!muted && video && !video.paused) handleVideoPlay();
  }, [handleVideoPlay, muted, videoRef]);

  if (!url) {
    return (
      <div className="flex size-full items-center justify-center bg-black">
        {urlQuery.isError || urlQuery.isSuccess ? null : (
          <LoaderCircle className="size-8 animate-spin text-white/60" />
        )}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={url}
      src={url}
      autoPlay
      playsInline
      muted={muted}
      onPlay={() => {
        if (!muted) handleVideoPlay();
      }}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (video.duration > 0) video.currentTime = video.duration * PREVIEW_START_RATIO;
      }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (video.duration > 0) onProgress(video.currentTime / video.duration);
      }}
      onEnded={onEnded}
      className="size-full bg-black object-contain"
    />
  );
}
