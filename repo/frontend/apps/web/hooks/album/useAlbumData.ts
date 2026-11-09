"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AlbumInfo, AlbumSubscriptionMutation } from "@/types/album/model";
import type { LibraryMediaItem } from "@/types/library/model";
import type { PlayerTrack } from "@/types/player/model";

import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useLibraryAccount } from "@/hooks/library/useLibraryAccount";
import { useLibraryAlbumsQuery } from "@/hooks/library/useLibraryAlbums";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import { useAlbumQuery } from "./useAlbumQuery";

const NO_TRACKS: PlayerTrack[] = [];

const colorCache = new Map<string, string>();
const COLOR_CACHE_LIMIT = 10;

export function useAlbumData() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const albumId = searchParams.get("id");
  const requireLoginAction = useRequireLoginAction();
  const queryClient = useQueryClient();
  const { account, provider } = useLibraryAccount();
  const {
    data: albumContent,
    isError,
    isFetching,
    isLoading,
    isRefetchError,
    refetch,
  } = useAlbumQuery(albumId);

  const [themeColor, setThemeColor] = useState("from-[#88b325]");
  const isPlaying = usePlayerStore((s) => s.isPlaying && s.playlistId === albumId);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const albumCollectionQuery = useLibraryAlbumsQuery();
  const albumCollectionQueryKey = musicQueryKeys.library.albums(
    provider.provider,
    account?.accountId ?? "",
  );
  const isAlbumCollected = albumId
    ? albumCollectionQuery.data?.some((item) => String(item.id) === albumId) === true
    : false;

  const ALBUM_INFO = useMemo<AlbumInfo | null>(() => {
    const album = albumContent?.album;
    if (!album) return null;

    const artist = album.artists[0];
    return {
      artistAvatar: artist?.avatarUrl ?? "",
      artistId: artist?.ref?.id ?? null,
      artistName: artist?.name ?? t("album.meta.unknownArtist"),
      company: album.company ?? "",
      cover: album.coverUrl ?? "",
      description: album.description,
      releaseYear:
        album.publishedAt === null
          ? t("album.meta.unknownYear")
          : new Date(album.publishedAt).toISOString().slice(0, 10),
      subType: album.subType ?? "",
      title: album.title || t("album.meta.unknownAlbum"),
      totalSongs: album.trackCount,
      type: album.releaseType ?? t("album.meta.type"),
    };
  }, [albumContent, t]);

  const tracks = albumContent?.tracks ?? NO_TRACKS;

  useEffect(() => {
    if (!ALBUM_INFO?.cover) return;

    const cached = colorCache.get(ALBUM_INFO.cover);
    if (cached) {
      setThemeColor(cached);
      return;
    }

    void import("@/lib/web/imageColor")
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
    const isCurrentQueue = player.playlistId === albumId;
    if (isCurrentQueue) player.setIsPlaying(!player.isPlaying);
    else {
      player.setQueue([...tracks], 0, albumId);
      void player.playQueueIndex(0);
    }
  }, [albumId, tracks]);

  const subscribeMutation = useMutation({
    mutationFn: ({ album, subscribe }: AlbumSubscriptionMutation) => {
      if (!provider.setAlbumSubscribed) throw new Error("Saving albums is not supported.");
      return provider.setAlbumSubscribed(album.ref, subscribe);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: albumCollectionQueryKey });
      const previousCollectedAlbums =
        queryClient.getQueryData<LibraryMediaItem[]>(albumCollectionQueryKey);

      queryClient.setQueryData<LibraryMediaItem[]>(albumCollectionQueryKey, (current = []) =>
        variables.subscribe
          ? [
              ...current.filter((item) => String(item.id) !== variables.album.ref.id),
              {
                coverUrl: variables.album.coverUrl ?? undefined,
                id: variables.album.ref.id,
                title: variables.album.title,
              },
            ]
          : current.filter((item) => String(item.id) !== variables.album.ref.id),
      );

      return { previousCollectedAlbums };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCollectedAlbums !== undefined) {
        queryClient.setQueryData(albumCollectionQueryKey, context.previousCollectedAlbums);
      } else {
        queryClient.removeQueries({ queryKey: albumCollectionQueryKey });
      }
      toast.error(t("album.toast.subscribeFailed"));
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.subscribe
          ? t("album.toast.subscribeSuccess")
          : t("album.toast.unsubscribeSuccess"),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: musicQueryKeys.library.albumsAll(provider.provider),
      });
      // NetEase's collection page reads its own list of the account's saved albums.
      if (provider.provider === "netease" && account) {
        void queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.collection(Number(account.accountId)),
        });
      }
    },
  });

  const handleToggleAlbumSubscribe = useCallback(async () => {
    const album = albumContent?.album;
    if (!album) return;

    await requireLoginAction(async () => {
      await subscribeMutation.mutateAsync({
        album,
        subscribe: !isAlbumCollected,
      });
    });
  }, [albumContent, isAlbumCollected, requireLoginAction, subscribeMutation]);

  const handleRefresh = useCallback(async () => {
    const hadCachedData = Boolean(albumContent);
    const result = await refetch();
    if (hadCachedData && result.isError) {
      toast.error(t("album.toast.refreshFailed"));
    }
  }, [albumContent, refetch, t]);

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
    isTogglingAlbumSubscribe:
      subscribeMutation.isPending || (account !== null && albumCollectionQuery.isPending),
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
