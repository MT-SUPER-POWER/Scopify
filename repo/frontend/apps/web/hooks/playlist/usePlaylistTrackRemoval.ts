"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { clearPageCache } from "@/lib/cache/pageCache";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { reportActionFailure } from "@/lib/web/errorTracking";
import type { PlaylistTrackRemovalVariables } from "@/types/playlist/api";

/** Removes a track from a playlist on its platform; present with `playlist.manage`. */
export function usePlaylistTrackRemoval() {
  const queryClient = useQueryClient();
  const provider = useActiveProvider();

  return useMutation({
    retry: false,
    meta: { operation: "playlist.track.del" },
    mutationKey: ["playlist", "track"],
    mutationFn: async ({ playlist, track }: PlaylistTrackRemovalVariables) => {
      if (!provider.capabilities.has("playlist.manage") || !provider.removePlaylistTracks) {
        throw new Error(`${provider.provider} cannot change playlists.`);
      }
      await provider.removePlaylistTracks(playlist, [track]);
    },
    onError: (error, { playlist, track }) => {
      reportActionFailure("playlist.track.del", error, {
        playlistId: playlist.id,
        trackId: track.id,
      });
    },
    onSuccess: async (_data, { playlist }) => {
      // Invalidate the lower cache before queries can fetch their new contents.
      try {
        await clearPageCache();
      } catch (error) {
        reportActionFailure("playlist.track.cache-clear", error);
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.playlist.contentOf(playlist.provider, playlist.id),
        }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.playlistsAll(playlist.provider),
        }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.likedPlaylistAll(playlist.provider),
        }),
      ]);
    },
  });
}
