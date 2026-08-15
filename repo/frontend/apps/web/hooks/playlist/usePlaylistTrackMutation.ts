"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updatePlaylistTrack } from "@/lib/api/track";
import { clearPageCache } from "@/lib/cache/pageCache";
import { reportActionFailure } from "@/lib/web/errorTracking";
import type { PlaylistTrackMutationVariables } from "@/types/api/playlist";

/** Mutation entry point for all add/remove playlist-track operations. */
export function usePlaylistTrackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { operation: "playlist.track.update" },
    mutationFn: (variables: PlaylistTrackMutationVariables) => updatePlaylistTrack(variables),
    mutationKey: ["playlist", "track"],
    onError: (error, variables) => {
      reportActionFailure(`playlist.track.${variables.operation}`, error, {
        playlistId: variables.playlistId,
        trackId: variables.trackId,
      });
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["playlist", "content", "playlist", String(variables.playlistId)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["library", "playlists"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["library", "liked-playlist"],
        }),
      ]);
      void clearPageCache();
    },
  });
}
