import { likeSong } from "@/lib/api/playlist";
import { toggleVoiceLike } from "@/lib/api/voicelist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";

/** Applies the same like-list mutation used by the Player Bar to external controls. */
export async function toggleCurrentSongLike(currentVoiceLiked = false) {
  const currentTrack = usePlayerStore.getState().currentSongDetail;
  const songId = currentTrack?.id;
  if (!songId) return false;

  if (currentTrack.voiceId !== undefined) {
    const nextLiked = !currentVoiceLiked;
    await toggleVoiceLike(currentTrack.voiceId, nextLiked);
    return nextLiked;
  }

  const userState = useUserStore.getState();
  const likedIds = Array.isArray(userState.likeListIDs)
    ? userState.likeListIDs.map((id) => Number(id))
    : [];
  const isLiked = likedIds.includes(songId);
  await likeSong(songId, !isLiked);
  userState.setLikeListIDs(
    isLiked ? likedIds.filter((id) => id !== songId) : [...likedIds, songId],
  );
  void clearPageCache();
  return !isLiked;
}
