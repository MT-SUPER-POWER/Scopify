"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { usePlaylistContentQuery } from "@/hooks/playlist/usePlaylistContentQuery";
import { resolveDailyRecommendationRequest } from "@/lib/playlist/dailyRecommendationRequest";
import { getMainColorFromImage } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistInfo } from "@/types/playlist";

const colorCache = new Map<string, string>([["daily", "#c42b2b"]]);
const COLOR_CACHE_LIMIT = 15;

function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey !== undefined) colorCache.delete(firstKey);
  }
  colorCache.set(key, value);
}

export function usePlaylist(playlistIdOverride?: null | string) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const playlistId = playlistIdOverride === undefined ? searchParams.get("id") : playlistIdOverride;
  const isRecommend = searchParams.get("isRecommend") === "true";
  const isDailyRecommend = searchParams.get("isDailyRecommend") === "true";
  const requestedDailyDate = searchParams.get("dailyDate");
  const dailyRecommendationRequest = resolveDailyRecommendationRequest(
    isDailyRecommend ? requestedDailyDate : null,
  );
  const dailyDate = isDailyRecommend ? dailyRecommendationRequest.dailyDate : null;
  const reportedError = useRef<unknown>(null);
  const { data, error, isPending, refetch, setTracks } = usePlaylistContentQuery({
    dailyCacheDate: dailyRecommendationRequest.cacheDate,
    dailyDate,
    isDailyRecommendation: isDailyRecommend,
    isRecommend,
    playlistId,
  });
  const rawDetail = data?.rawDetail ?? null;

  useEffect(() => {
    if (!error || reportedError.current === error) return;
    reportedError.current = error;
    toast.error(isDailyRecommend ? t("home.toast.loadFailed") : t("sidebar.toast.fetchFailed"));
  }, [error, isDailyRecommend, t]);

  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!rawDetail) return null;

    if (isDailyRecommend) {
      return {
        isSpecial: true,
        dailyDate: dailyDate ?? undefined,
        privacy: t("playlist.meta.madeForYou"),
        tags: [t("playlist.meta.dailyTag"), t("playlist.meta.recommendationTag")],
        title: dailyDate
          ? t("playlist.meta.historicalDailyTitle", { date: dailyDate })
          : t("playlist.meta.dailyTitle"),
        cover: null,
        createTime: dailyDate ?? new Date().toLocaleDateString(),
        creator: t("playlist.meta.spotify"),
        creatorID: null,
        creatorAvatar: "",
        likes: "-",
        totalSongs: rawDetail.trackCount ?? 0,
      };
    }

    return {
      isSpecial: false,
      privacy:
        rawDetail.privacy === 0
          ? t("playlist.meta.public")
          : rawDetail.privacy === 10
            ? t("playlist.meta.private")
            : t("playlist.meta.unknownPrivacy"),
      tags: rawDetail.tags ?? [],
      title: rawDetail.name ?? t("playlist.meta.unknown"),
      cover: rawDetail.coverImgUrl ?? "https://picsum.photos/400/400?random=123",
      createTime: rawDetail.createTime
        ? new Date(rawDetail.createTime).toLocaleDateString()
        : t("playlist.meta.unknownDate"),
      creator: rawDetail.creator?.nickname ?? t("common.meta.unknownUser"),
      creatorID: rawDetail.creator?.userId ?? null,
      creatorAvatar: rawDetail.creator?.avatarUrl ?? "",
      likes: rawDetail.subscribedCount ?? 0,
      totalSongs: rawDetail.trackCount ?? 0,
    };
  }, [dailyDate, isDailyRecommend, rawDetail, t]);

  const colorCacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
  const cachedColor = colorCacheKey ? (colorCache.get(colorCacheKey) ?? null) : null;
  const [fetchedColor, setFetchedColor] = useState<{ color: string; key: string } | null>(null);

  useEffect(() => {
    if (!colorCacheKey || colorCache.has(colorCacheKey)) return;

    setFetchedColor(null);
    getMainColorFromImage(colorCacheKey).then((color) => {
      if (!color) return;
      setColorCache(colorCacheKey, color);
      setFetchedColor({ color, key: colorCacheKey });
    });
  }, [colorCacheKey]);
  const currentFetchedColor =
    fetchedColor && fetchedColor.key === colorCacheKey ? fetchedColor.color : null;

  return {
    dailyDate,
    isDailyRecommend,
    isLoading: isPending,
    playlistId,
    playlistInfo,
    refetchTracks: refetch,
    setTracks,
    themeColor: cachedColor ?? currentFetchedColor,
    tracks: data?.tracks ?? [],
  };
}
