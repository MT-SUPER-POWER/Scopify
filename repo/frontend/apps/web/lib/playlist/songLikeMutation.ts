import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { useUserStore } from "@/store/module/user";
import type { SongLikeMutationVariables } from "@/types/api/playlist";
import type {
  SongLikeMutationContext,
  SongLikeMutationDependencies,
  SongLikeMutationMessages,
} from "@/types/playlist";

const DEFAULT_DEPENDENCIES: SongLikeMutationDependencies = {
  clearPageCache,
  mutateSong: likeSong,
};

/**
 * The single mutation lifecycle for every song-like entry point.
 *
 * Keeping the options outside React makes optimistic state, rollback, cache
 * invalidation and the real request independently testable. Components must
 * consume it through `useSongLikeMutation`, never call `likeSong` directly.
 */
export function createSongLikeMutationOptions(
  queryClient: QueryClient,
  messages: SongLikeMutationMessages,
  dependencies: SongLikeMutationDependencies = DEFAULT_DEPENDENCIES,
): UseMutationOptions<unknown, unknown, SongLikeMutationVariables, SongLikeMutationContext> {
  return {
    meta: { operation: "playlist.song.like" },
    mutationFn: ({ like, songId }) => dependencies.mutateSong(songId, like),
    mutationKey: ["playlist", "song", "like"],
    onMutate: async ({ like, songId }) => {
      const store = useUserStore.getState();
      const current = Array.isArray(store.likeListIDs)
        ? store.likeListIDs.map((id) => Number(id))
        : [];
      const numericId = Number(songId);
      const nextList = like
        ? current.includes(numericId)
          ? current
          : [...current, numericId]
        : current.filter((id) => id !== numericId);

      store.setLikeListIDs(nextList);
      return { previousLikeListIDs: current };
    },
    onError: (error, variables, context) => {
      if (context?.previousLikeListIDs) {
        useUserStore.getState().setLikeListIDs(context.previousLikeListIDs);
      }
      reportActionFailure(`playlist.song.${variables.like ? "like" : "unlike"}`, error, {
        like: variables.like,
        songId: variables.songId,
      });
      if (!variables.silentToast) toast.error(messages.failure);
    },
    onSuccess: async (_data, variables) => {
      if (!variables.silentToast) {
        toast.success(variables.like ? messages.liked : messages.unliked);
      }
      // LibItem is backed by the user-playlists query. Clear the lower page
      // cache first, then force both active and inactive library consumers to
      // refetch so like and unlike cannot replay stale playlist metadata.
      try {
        await dependencies.clearPageCache();
      } catch (error) {
        // The remote mutation already succeeded. A cache cleanup failure must
        // not suppress the authoritative Query refetch or report the like as
        // failed to the caller.
        reportActionFailure("playlist.song.like.cache-clear", error, {
          like: variables.like,
          songId: variables.songId,
        });
      }
      const userId = useUserStore.getState().user?.userId;
      const likedPlaylistKey = userId
        ? musicQueryKeys.library.likedPlaylist(userId)
        : (["library", "liked-playlist"] as const);
      const playlistsKey = userId
        ? musicQueryKeys.library.playlists(userId)
        : (["library", "playlists"] as const);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: likedPlaylistKey, refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: playlistsKey, refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["playlist", "content"] }),
      ]);
    },
  };
}
