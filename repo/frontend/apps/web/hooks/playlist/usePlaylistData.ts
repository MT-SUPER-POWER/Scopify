"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { usePlaylistContentQuery } from "@/hooks/playlist/usePlaylistContentQuery";
import { resolveDailyRecommendationRequest } from "@/lib/playlist/dailyRecommendationRequest";
import { getMainColorFromImage } from "@/lib/web/imageColor";
import { useTranslation } from "react-i18next";

import type { PlaylistInfo } from "@/types/playlist/model";

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
  const { t } = useTranslation();
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
  const detail = data?.detail ?? null;
  const trackCount = data?.tracks.length ?? 0;
  const hasContent = data !== undefined;

  useEffect(() => {
    if (!error || reportedError.current === error) return;
    reportedError.current = error;
    toast.error(isDailyRecommend ? t("home.toast.loadFailed") : t("sidebar.toast.fetchFailed"));
  }, [error, isDailyRecommend, t]);

  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!hasContent) return null;

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
        totalSongs: trackCount,
      };
    }
    if (!detail) return null;

    const neteaseExtras = detail.netease;
    return {
      ref: detail.ref,
      isSpecial: false,
      specialType: neteaseExtras?.specialType,
      description: detail.description,
      privacy:
        detail.visibility === "public"
          ? t("playlist.meta.public")
          : detail.visibility === "private"
            ? t("playlist.meta.private")
            : t("playlist.meta.unknownPrivacy"),
      tags: [...detail.tags],
      title: detail.title || t("playlist.meta.unknown"),
      cover: detail.coverUrl ?? "https://picsum.photos/400/400?random=123",
      createTime: detail.createdAt
        ? new Date(detail.createdAt).toLocaleDateString()
        : t("playlist.meta.unknownDate"),
      creator: detail.creator?.name || t("common.meta.unknownUser"),
      // Profiles are NetEase pages; another platform's creator is shown without a link.
      creatorID:
        detail.creator?.account?.provider === "netease" ? detail.creator.account.accountId : null,
      creatorAvatar: detail.creator?.avatarUrl ?? "",
      likes: neteaseExtras?.subscribedCount ?? detail.playCount ?? 0,
      likesLabel: neteaseExtras
        ? undefined
        : detail.playCount === null
          ? ""
          : t("playlist.meta.playCount", {
              count: detail.playCount,
              replace: { count: detail.playCount.toLocaleString() },
            }),
      totalSongs: detail.trackCount,
      subscribed: neteaseExtras?.subscribed ?? false,
    };
  }, [dailyDate, detail, hasContent, isDailyRecommend, t, trackCount]);

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
