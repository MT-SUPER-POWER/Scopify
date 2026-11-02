"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useTranslation } from "react-i18next";

import type { NowPlayingMvPlayerProps } from "@/types/player/nowPlayingComponents";

/** 面板封面位里的 MV 播放器；观看途中用户从播放栏继续放歌时直接收起，不再抢回声音。 */
export function NowPlayingMvPlayer({ mvId, onClose }: NowPlayingMvPlayerProps) {
  const { t } = useTranslation();
  const isSongPlaying = usePlaybackProjection().isPlaying;
  const urlQuery = useMVUrlQuery(mvId);
  const url = urlQuery.data?.data?.url ?? null;
  const wasSongPlayingRef = useRef(isSongPlaying);

  // 只响应「暂停 → 播放」的变化：打开 MV 时歌曲的暂停可能还没反映到投影上
  useEffect(() => {
    if (!wasSongPlayingRef.current && isSongPlaying) onClose(false);
    wasSongPlayingRef.current = isSongPlaying;
  }, [isSongPlaying, onClose]);

  return (
    <div className="absolute inset-0 bg-black">
      {url ? (
        <video
          key={url}
          src={url}
          autoPlay
          controls
          playsInline
          onEnded={() => onClose(true)}
          className="size-full object-contain"
        />
      ) : urlQuery.isError || (urlQuery.isSuccess && !url) ? (
        <button
          type="button"
          onClick={() => onClose(true)}
          className="flex size-full items-center justify-center text-sm text-white/70 hover:text-white"
        >
          {t("nowPlaying.closeMv")}
        </button>
      ) : (
        <LoaderCircle className="absolute inset-0 m-auto size-6 animate-spin text-white/70" />
      )}
    </div>
  );
}
