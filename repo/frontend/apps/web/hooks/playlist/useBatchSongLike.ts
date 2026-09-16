"use client";

import { toast } from "sonner";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useAppDragStore } from "@/store/module/appDrag";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";

export function useBatchSongLike() {
  const songLikeMutation = useSongLikeMutation();
  const { t } = useI18n();

  const batchLike = async (songs: Pick<SongDetail, "id">[], targetLike = true) => {
    const drag = useAppDragStore.getState();
    if (!songs.length || drag.pendingTargetIds.includes("liked")) return;
    const user = useUserStore.getState().user;
    if (!isRealUser(user)) {
      toast.error(t("sidebar.card.loginTitle"));
      return;
    }
    const likeSet = new Set(useUserStore.getState().likeListIDs ?? []);
    const ids = [...new Set(songs.map((song) => song.id))];
    const toChange = ids.filter((id) => targetLike ? !likeSet.has(id) : likeSet.has(id));
    if (!toChange.length) {
      toast.info(t(targetLike ? "playlist.drop.alreadyLiked" : "playlist.drop.notLiked"));
      return;
    }
    drag.setTargetPending("liked", true);
    const toastId = toast.loading(t("playlist.drop.processing"));
    let succeeded = 0;
    let failed = 0;
    // Like mutations roll back a snapshot of the whole like list. Serialize them
    // so one failed song cannot undo a different song's optimistic success.
    try {
      for (const songId of toChange) {
        if (useUserStore.getState().user?.userId !== user?.userId) {
          failed += toChange.length - succeeded - failed;
          break;
        }
        try {
          await songLikeMutation.mutateAsync({ like: targetLike, songId, silentToast: true });
          succeeded++;
        } catch {
          failed++;
        }
      }
      const skipped = ids.length - toChange.length;
      if (failed) toast.error(t("playlist.drop.likePartial", { count: succeeded, failed, skipped }), { id: toastId });
      else toast.success(t(targetLike ? "playlist.drop.liked" : "playlist.drop.unliked", { count: succeeded, skipped }), { id: toastId });
    } finally {
      useAppDragStore.getState().setTargetPending("liked", false);
    }
  };
  return { batchLike };
}
