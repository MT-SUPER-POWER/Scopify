"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { MusicCreatePlaylistInput } from "@scopify/music-domain/library";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { clearPageCache } from "@/lib/cache/pageCache";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { reportActionFailure } from "@/lib/web/errorTracking";

export interface CreateLibraryPlaylistVariables extends MusicCreatePlaylistInput {
  /** Tracks to put in the new playlist; they must be of the active platform. */
  tracks?: readonly MusicResourceRef<"track">[];
}

export interface SubscribeLibraryPlaylistVariables {
  playlist: MusicResourceRef<"playlist">;
  subscribed: boolean;
}

/**
 * Creating, deleting and saving playlists on the active platform, plus adding tracks to one.
 * Each action exists only on platforms with `playlist.manage`; calling one without it throws,
 * so a screen shows the control only behind that capability.
 */
export function useLibraryPlaylistActions() {
  const queryClient = useQueryClient();
  const provider = useActiveProvider();

  const refresh = useCallback(
    async (playlist?: MusicResourceRef<"playlist"> | null) => {
      // Invalidate the lower cache before queries can fetch their new contents.
      try {
        await clearPageCache();
      } catch (error) {
        reportActionFailure("library.playlist.cache-clear", error);
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.playlistsAll(provider.provider),
        }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.likedPlaylistAll(provider.provider),
        }),
        queryClient.invalidateQueries({
          queryKey: playlist
            ? musicQueryKeys.playlist.contentOf(playlist.provider, playlist.id)
            : musicQueryKeys.playlist.all(provider.provider),
        }),
      ]);
    },
    [provider.provider, queryClient],
  );

  const requireManage = useCallback(() => {
    if (!provider.capabilities.has("playlist.manage")) {
      throw new Error(`${provider.provider} cannot manage playlists.`);
    }
  }, [provider]);

  const create = useMutation({
    retry: false,
    meta: { operation: "library.playlist.create" },
    mutationFn: async ({ tracks = [], ...input }: CreateLibraryPlaylistVariables) => {
      requireManage();
      if (!provider.createPlaylist)
        throw new Error(`${provider.provider} cannot create playlists.`);
      const playlist = await provider.createPlaylist(input);
      if (tracks.length > 0) {
        if (!playlist || !provider.addPlaylistTracks) {
          throw new Error(`${provider.provider} could not add tracks to the new playlist.`);
        }
        await provider.addPlaylistTracks(playlist, tracks);
      }
      return playlist;
    },
    onError: (error) => reportActionFailure("library.playlist.create", error),
    onSettled: (playlist) => refresh(playlist),
  });

  const remove = useMutation({
    retry: false,
    meta: { operation: "library.playlist.delete" },
    mutationFn: async (playlist: MusicResourceRef<"playlist">) => {
      requireManage();
      if (!provider.deletePlaylist)
        throw new Error(`${provider.provider} cannot delete playlists.`);
      await provider.deletePlaylist(playlist);
    },
    onError: (error) => reportActionFailure("library.playlist.delete", error),
    onSettled: (_data, _error, playlist) => refresh(playlist),
  });

  const subscribe = useMutation({
    retry: false,
    meta: { operation: "library.playlist.subscribe" },
    mutationFn: async ({ playlist, subscribed }: SubscribeLibraryPlaylistVariables) => {
      requireManage();
      if (!provider.setPlaylistSubscribed) {
        throw new Error(`${provider.provider} cannot save playlists.`);
      }
      await provider.setPlaylistSubscribed(playlist, subscribed);
    },
    onError: (error) => reportActionFailure("library.playlist.subscribe", error),
    onSettled: (_data, _error, { playlist }) => refresh(playlist),
  });

  return { create, remove, subscribe };
}
