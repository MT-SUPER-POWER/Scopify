import type { MusicProvider, MusicResourceRef } from "@scopify/music-domain/identity";
import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

import { clearPageCache } from "@/lib/cache/pageCache";
import { getMusicProvider } from "@/lib/providers";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { reportActionFailure } from "@/lib/web/errorTracking";
import { useUserStore } from "@/store/module/user";
import type { SongLikeMutationVariables } from "@/types/playlist/api";
import type {
  SongLikeMutationContext,
  SongLikeMutationDependencies,
  SongLikeMutationMessages,
} from "@/types/playlist/model";

/** A track reference for the NetEase song ID the NetEase-only entry points hold. */
function neteaseTrackRef(songId: number | string): MusicResourceRef<"track"> {
  return { provider: "netease", kind: "track", id: String(songId) };
}

function trackOf(variables: SongLikeMutationVariables): MusicResourceRef<"track"> {
  return variables.track ?? neteaseTrackRef(variables.songId);
}

/** The signed-in NetEase account lives in the user store; other platforms supply theirs. */
function neteaseAccountId(): string | null {
  const userId = useUserStore.getState().user?.userId;
  return userId ? String(userId) : null;
}

export function createDefaultDependencies(
  accountIdOf: (provider: MusicProvider) => string | null,
): SongLikeMutationDependencies {
  return {
    accountIdOf: (provider) =>
      provider === "netease" ? neteaseAccountId() : accountIdOf(provider),
    clearPageCache,
    mutateTrack: async (track, like) => {
      const provider = getMusicProvider(track.provider);
      if (!provider.capabilities.has("track.like") || !provider.setTrackLiked) {
        throw new Error(`${track.provider} cannot like tracks.`);
      }
      await provider.setTrackLiked(track, like);
    },
  };
}

/**
 * The single mutation lifecycle for every song-like entry point.
 *
 * Keeping the options outside React makes optimistic state, rollback, cache
 * invalidation and the real request independently testable. Components must
 * consume it through `useSongLikeMutation`, never call a platform's like API directly.
 * The liked state of a track belongs to one platform and one account, so the optimistic
 * update touches only the liked IDs cached for that pair.
 */
export function createSongLikeMutationOptions(
  queryClient: QueryClient,
  messages: SongLikeMutationMessages,
  dependencies: SongLikeMutationDependencies,
): UseMutationOptions<unknown, unknown, SongLikeMutationVariables, SongLikeMutationContext> {
  return {
    meta: { operation: "playlist.song.like" },
    mutationFn: (variables) => dependencies.mutateTrack(trackOf(variables), variables.like),
    mutationKey: ["playlist", "song", "like"],
    onMutate: async (variables) => {
      const track = trackOf(variables);
      const { like } = variables;
      const context: SongLikeMutationContext = { previousLikeListIDs: null };

      // NetEase's older entry points read the like list from the user store.
      if (track.provider === "netease") {
        const store = useUserStore.getState();
        const current = Array.isArray(store.likeListIDs)
          ? store.likeListIDs.map((id) => Number(id))
          : [];
        const numericId = Number(track.id);
        store.setLikeListIDs(
          like
            ? current.includes(numericId)
              ? current
              : [...current, numericId]
            : current.filter((id) => id !== numericId),
        );
        context.previousLikeListIDs = current;
      }

      const accountId = dependencies.accountIdOf(track.provider);
      if (accountId) {
        const queryKey = musicQueryKeys.library.likedTrackIds(track.provider, accountId);
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<string[]>(queryKey);
        if (previous) {
          context.previousTrackIds = { accountId, ids: previous };
          queryClient.setQueryData<string[]>(
            queryKey,
            like
              ? previous.includes(track.id)
                ? previous
                : [...previous, track.id]
              : previous.filter((id) => id !== track.id),
          );
        }
      }
      return context;
    },
    onError: (error, variables, context) => {
      const track = trackOf(variables);
      if (context?.previousLikeListIDs) {
        useUserStore.getState().setLikeListIDs(context.previousLikeListIDs);
      }
      if (context?.previousTrackIds) {
        queryClient.setQueryData(
          musicQueryKeys.library.likedTrackIds(track.provider, context.previousTrackIds.accountId),
          context.previousTrackIds.ids,
        );
      }
      reportActionFailure(`playlist.song.${variables.like ? "like" : "unlike"}`, error, {
        like: variables.like,
        provider: track.provider,
        songId: track.id,
      });
      if (!variables.silentToast) toast.error(messages.failure);
    },
    onSuccess: async (_data, variables) => {
      const track = trackOf(variables);
      if (!variables.silentToast) {
        toast.success(variables.like ? messages.liked : messages.unliked);
      }
      // The library list is backed by the user-playlists query. Clear the lower page
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
          provider: track.provider,
          songId: track.id,
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.likedPlaylistAll(track.provider),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: musicQueryKeys.library.playlistsAll(track.provider),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({ queryKey: musicQueryKeys.playlist.all(track.provider) }),
        // NetEase's optimistic like list is the authority until its next page load; the other
        // platforms confirm the set with the account's own list.
        ...(track.provider === "netease"
          ? []
          : [
              queryClient.invalidateQueries({
                queryKey: musicQueryKeys.library.likedTrackIdsAll(track.provider),
              }),
            ]),
      ]);
    },
  };
}
