import { likeSong } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";

/** Applies the same like-list mutation used by the Player Bar to external controls. */
export async function toggleCurrentSongLike() {
  const songId = usePlayerStore.getState().currentSongDetail?.id;
  if (!songId) return;

  const userState = useUserStore.getState();
  const likedIds = Array.isArray(userState.likeListIDs)
    ? userState.likeListIDs.map((id) => Number(id))
    : [];
  const isLiked = likedIds.includes(songId);
  await likeSong(songId, !isLiked);
  userState.libraryUpdateTrigger += 1;
  userState.setLikeListIDs(
    isLiked ? likedIds.filter((id) => id !== songId) : [...likedIds, songId],
  );
  void clearPageCache();
}
