"use client";

import { VolumeX } from "lucide-react";
import { useState } from "react";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { cn } from "@/lib/utils";
import type { MvCardPreviewProps } from "@/types/mv/components";

/** 悬停预览用的低清晰度，起播快、流量小。 */
const PREVIEW_RESOLUTION = 480;

/**
 * MV 卡片悬停时在封面上静音播放的预览（同 YouTube 首页的悬停预览），
 * 顶部静音图标、底部细进度条随播放推进；加载出首帧前保持透明，露出静态封面。
 */
export function MvCardPreview({ mvid }: MvCardPreviewProps) {
  const url = useMVUrlQuery(mvid, PREVIEW_RESOLUTION).data?.data?.url ?? null;
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!url) return null;

  return (
    <>
      <video
        src={url}
        autoPlay
        muted
        playsInline
        loop
        aria-hidden
        onPlaying={() => setIsReady(true)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          if (video.duration > 0) setProgress(video.currentTime / video.duration);
        }}
        className={cn(
          "absolute inset-0 size-full bg-black object-cover transition-opacity duration-300",
          isReady ? "opacity-100" : "opacity-0",
        )}
      />
      {isReady && (
        <>
          <span
            aria-hidden
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white shadow backdrop-blur-xs"
          >
            <VolumeX className="size-3.5" />
          </span>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/30">
            <span
              className="block h-full bg-brand transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
        </>
      )}
    </>
  );
}
