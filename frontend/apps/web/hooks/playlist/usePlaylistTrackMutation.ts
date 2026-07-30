"use client";

import { useMutation } from "@tanstack/react-query";

import { updatePlaylistTrack } from "@/lib/api/track";
import { reportActionFailure } from "@/lib/web/errorTracking";
import type { PlaylistTrackMutationVariables } from "@/types/api/playlist";

/** Mutation entry point for all add/remove playlist-track operations. */
export function usePlaylistTrackMutation() {
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
  });
}
