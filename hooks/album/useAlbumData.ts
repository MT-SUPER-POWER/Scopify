"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AlbumInfo, AlbumSubscriptionMutation } from "@/types/album";

import { subscribeAlbum } from "@/lib/api/album";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/api/music";

import { useAlbumQuery } from "./useAlbumQuery";

const colorCache = new Map<string, string>();
const COLOR_CACHE_LIMIT = 10;

export function useAlbumData() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const albumId = searchParams.get("id");
  const requireLoginAction = useRequireLoginAction();
  const {
    data: albumDetail,
    isError,
    isFetching,
    isLoading,
    isRefetchError,
    refetch,
  } = useAlbumQuery(albumId);

  const [themeColor, setThemeColor] = useState("from-[#88b325]");
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const collectedAlbumIds = useUserStore((s) => s.collectedAlbumIds);
  const setCollectedAlbumId = useUserStore((s) => s.setCollectedAlbumId);
  const isAlbumCollected = albumId ? collectedAlbumIds.has(Number(albumId)) : false;

  const ALBUM_INFO = useMemo<AlbumInfo | null>(() => {
    const album = albumDetail?.album;
    if (!album) return null;

    const artist = album.artist ?? album.artists?.[0];
    return {
      artistAvatar: artist?.picUrl ?? artist?.img1v1Url ?? "",
      artistId: artist?.id,
      artistName: artist?.name ?? t("album.meta.unknownArtist"),
      company: album.company ?? "",
      cover: album.picUrl ?? "",
      description: album.description ?? "",
      releaseYear: album.publishTime
        ? new Date(album.publishTime).toISOString().slice(0, 10)
        : t("album.meta.unknownYear"),
      subType: album.subType ?? "",
      title: album.name ?? t("album.meta.unknownAlbum"),
      totalSongs: album.size ?? 0,
      type: album.type ?? t("album.meta.type"),
    };
  }, [albumDetail, t]);

  const tracks = useMemo(() => {
    if (!albumDetail?.songs) return [];

    const cover = albumDetail.album?.picUrl ?? albumDetail.album?.blurPicUrl;
    return albumDetail.songs.map((song) =>
      pruneSongDetail({
        ...song,
        al: { ...song.al, picUrl: song.al?.picUrl ?? cover ?? "" },
      }),
    );
  }, [albumDetail]);

  useEffect(() => {
    if (!ALBUM_INFO?.cover) return;

    const cached = colorCache.get(ALBUM_INFO.cover);
    if (cached) {
      setThemeColor(cached);
      return;
    }

    void import("@/lib/utils")
      .then(({ getMainColorFromImage }) => getMainColorFromImage(ALBUM_INFO.cover))
      .then((color) => {
        if (!color) return;
        setColorCache(ALBUM_INFO.cover, color);
        setThemeColor(color);
      })
      .catch(() => setThemeColor("#88b325"));
  }, [ALBUM_INFO?.cover]);

  const togglePlay = useCallback(() => {
    if (!tracks.length) return;

    const player = usePlayerStore.getState();
    const isCurrentQueue =
      player.queue.length === tracks.length && player.queue[0]?.id === tracks[0]?.id;
    if (isCurrentQueue) player.setIsPlaying(!player.isPlaying);
    else {
      player.setQueue(tracks, 0);
      void player.playQueueIndex(0);
    }
  }, [tracks]);

  const subscribeMutation = useMutation({
    mutationFn: ({ id, subscribe }: AlbumSubscriptionMutation) => subscribeAlbum(id, subscribe),
    onError: (_error, variables) => {
      setCollectedAlbumId(Number(variables.id), variables.previousCollected);
      toast.error(t("album.toast.subscribeFailed"));
    },
    onMutate: (variables) => {
      setCollectedAlbumId(Number(variables.id), variables.subscribe);
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.subscribe
          ? t("album.toast.subscribeSuccess")
          : t("album.toast.unsubscribeSuccess"),
      );
    },
  });

  const handleToggleAlbumSubscribe = useCallback(async () => {
    if (!albumId) return;

    await requireLoginAction("album-subscribe", async () => {
      await subscribeMutation.mutateAsync({
        id: albumId,
        previousCollected: isAlbumCollected,
        subscribe: !isAlbumCollected,
      });
    });
  }, [albumId, isAlbumCollected, requireLoginAction, subscribeMutation]);

  const handleRefresh = useCallback(async () => {
    const hadCachedData = Boolean(albumDetail);
    const result = await refetch();
    if (hadCachedData && result.isError) {
      toast.error(t("album.toast.refreshFailed"));
    }
  }, [albumDetail, refetch, t]);

  return {
    ALBUM_INFO,
    albumId,
    handleRefresh,
    handleToggleAlbumSubscribe,
    isAlbumCollected,
    isError,
    isLoading,
    isPlaying,
    isRefetchError,
    isRefreshing: isFetching,
    isShuffle,
    isTogglingAlbumSubscribe: subscribeMutation.isPending,
    themeColor,
    togglePlay,
    tracks,
  };
}

function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey !== undefined) colorCache.delete(firstKey);
  }
  colorCache.set(key, value);
}
