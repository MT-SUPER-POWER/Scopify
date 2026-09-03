import type { QueryClient } from "@tanstack/react-query";
import { likeSong } from "@/lib/api/playlist";
import { toggleVoiceLike } from "@/lib/api/voicelist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";

/** Applies the same like-list mutation used by the Player Bar to external controls. */
export async function toggleCurrentSongLike(currentVoiceLiked = false, queryClient?: QueryClient) {
  const currentTrack = usePlayerStore.getState().currentSongDetail;
  const songId = currentTrack?.id;
  if (!songId) return false;

  if (currentTrack.voiceId !== undefined) {
    const nextLiked = !currentVoiceLiked;
    await toggleVoiceLike(currentTrack.voiceId, nextLiked);
    if (queryClient) {
      await queryClient.invalidateQueries({
        queryKey: ["library", "podcasts", "liked-voices"],
      });
    }
    return nextLiked;
  }

  const userState = useUserStore.getState();
  const likedIds = Array.isArray(userState.likeListIDs)
    ? userState.likeListIDs.map((id) => Number(id))
    : [];
  const isLiked = likedIds.includes(songId);
  const nextLiked = !isLiked;
  await likeSong(songId, nextLiked);
  userState.setLikeListIDs(
    nextLiked ? [...likedIds, songId] : likedIds.filter((id) => id !== songId),
  );
  void clearPageCache();

  if (queryClient) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["library", "liked-playlist"] }),
      queryClient.invalidateQueries({ queryKey: ["library", "playlists"] }),
      queryClient.invalidateQueries({ queryKey: ["playlist", "content"] }),
    ]);
  }

  return nextLiked;
}
