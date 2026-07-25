"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getHistoricalDailyRecommendationDetail,
  getPlaylistAllTracks,
  getPlaylsitDetail,
} from "@/lib/api/playlist";
import { getRecommendedSongs } from "@/lib/api/track";
import {
  createPageCacheKey,
  dailyTtlMs,
  getPageCache,
  pageTtlMs,
  setPageCache,
} from "@/lib/cache/pageCache";
import { getMainColorFromImage } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail, type RawSongDetail } from "@/types/api/music";
import {
  prunePlaylistTracks,
  type HistoricalDailyRecommendationDetailResponse,
  type PlaylistCachePayload,
  type RawNeteasePlaylist,
} from "@/types/api/playlist";
import type { PlaylistInfo } from "@/types/playlist";

const DAILY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 颜色缓存机制 (全局共享)
const colorCache = new Map<string, string>();
colorCache.set("daily", "#c42b2b");
colorCache.set("default", "#88b325");
const COLOR_CACHE_LIMIT = 15;

function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey !== undefined) {
      colorCache.delete(firstKey);
    }
  }
  colorCache.set(key, value);
}

function getDailyCacheDate() {
  return new Date().toISOString().slice(0, 10);
}

function getHistoricalSongs(
  response: HistoricalDailyRecommendationDetailResponse,
): RawSongDetail[] {
  const songs = response.data?.dailySongs ?? response.data?.songs;
  return Array.isArray(songs) ? songs : [];
}

export function usePlaylist() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");
  const isRecommend = searchParams.get("isRecommend") === "true";
  const isDailyRecommend = searchParams.get("isDailyRecommend") === "true";
  const requestedDailyDate = searchParams.get("dailyDate");
  const dailyDate =
    isDailyRecommend && requestedDailyDate && DAILY_DATE_PATTERN.test(requestedDailyDate)
      ? requestedDailyDate
      : null;
  const dailyCacheDate = dailyDate ?? getDailyCacheDate();
  const [rawDetail, setRawDetail] = useState<RawNeteasePlaylist | null>(null);

  const currentReqKey = isDailyRecommend ? `daily:${dailyCacheDate}` : playlistId;
  const [prevReqKey, setPrevReqKey] = useState<string | null>(null);

  if (currentReqKey !== prevReqKey) {
    setPrevReqKey(currentReqKey);
    setRawDetail(null);
  }

  const isLoading = Boolean(currentReqKey) && !rawDetail;
  const _libraryUpdateTrigger = useUserStore((state) => state.libraryUpdateTrigger);

  useEffect(() => {
    if (!currentReqKey) return;

    let ignore = false;
    const cookie = typeof window !== "undefined" ? localStorage.getItem("music_cookie") || "" : "";
    const cacheKey = isDailyRecommend
      ? createPageCacheKey("daily", [dailyCacheDate])
      : createPageCacheKey("playlist", [playlistId, isRecommend]);

    getPageCache<PlaylistCachePayload>(cacheKey).then((cached) => {
      if (ignore || !cached) return;
      setRawDetail(cached.rawDetail);
      useUserStore.getState().setAlbumList(cached.tracks ?? []);
    });

    const fetchMusicData = async () => {
      try {
        if (isDailyRecommend) {
          let dailySongs: RawSongDetail[];
          if (dailyDate) {
            dailySongs = getHistoricalSongs(
              (await getHistoricalDailyRecommendationDetail(dailyDate, cookie)).data,
            );
          } else {
            const response = await getRecommendedSongs();
            dailySongs = Array.isArray(response.data?.data?.dailySongs)
              ? response.data.data.dailySongs
              : [];
          }

          if (ignore) return;
          const nextDetail = {
            name: dailyDate
              ? t("playlist.meta.historicalDailyTitle", { date: dailyDate })
              : t("playlist.meta.dailyTitle"),
            trackCount: dailySongs.length,
            tracks: dailySongs,
          };
          const tracks = dailySongs.map(pruneSongDetail);
          setRawDetail(nextDetail);
          useUserStore.getState().setAlbumList(tracks);
          await setPageCache(
            cacheKey,
            { rawDetail: nextDetail, tracks },
            dailyDate ? pageTtlMs() : dailyTtlMs(),
          );
        } else {
          const [detailResponse, trackResponse] = await Promise.all([
            getPlaylsitDetail({
              id: playlistId as string,
              cookie: isRecommend ? cookie : undefined,
            }),
            getPlaylistAllTracks({
              id: playlistId as string,
              cookie: isRecommend ? cookie : undefined,
            }),
          ]);
          if (ignore) return;
          const playlist = detailResponse.data.playlist;
          if (!playlist) throw new Error("Playlist detail is missing");
          const tracks = prunePlaylistTracks(trackResponse.data);
          setRawDetail(playlist);
          useUserStore.getState().setAlbumList(tracks);
          await setPageCache(cacheKey, { rawDetail: playlist, tracks }, pageTtlMs());
        }
      } catch (error) {
        if (ignore) return;
        console.error(error);
        toast.error(isDailyRecommend ? t("home.toast.loadFailed") : t("sidebar.toast.fetchFailed"));
      }
    };

    void fetchMusicData();

    return () => {
      ignore = true;
    };
  }, [
    currentReqKey,
    playlistId,
    isDailyRecommend,
    isRecommend,
    dailyDate,
    dailyCacheDate,
    t,
    _libraryUpdateTrigger,
  ]);

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
  }, [rawDetail, isDailyRecommend, dailyDate, t]);

  const cachedColor = useMemo(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey) return null;
    return colorCache.get(cacheKey) ?? null;
  }, [isDailyRecommend, playlistInfo?.cover]);

  const [fetchedColor, setFetchedColor] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey || colorCache.has(cacheKey)) return;

    getMainColorFromImage(cacheKey).then((color) => {
      if (color) {
        setColorCache(cacheKey, color);
        setFetchedColor(color);
      }
    });
  }, [isDailyRecommend, playlistInfo?.cover]);

  return {
    playlistId,
    isDailyRecommend,
    dailyDate,
    isLoading,
    playlistInfo,
    themeColor: cachedColor ?? fetchedColor ?? "#88b325",
  };
}
