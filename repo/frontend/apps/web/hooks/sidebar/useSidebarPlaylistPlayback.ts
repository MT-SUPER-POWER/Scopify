import { toast } from "sonner";
import { getPlaylistAllTracks, getUserLikeLists } from "@/lib/api/playlist";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/api/music";

export function useSidebarPlaylistPlayback(playlistID: number | string) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const requireLoginAction = useRequireLoginAction();
  return async () => {
    await requireLoginAction(async () => {
      try {
        const uid = useUserStore.getState().user?.userId;
        if (!uid) return;
        const [tracksRes, likeListsRes] = await Promise.all([
          getPlaylistAllTracks({ id: playlistID }),
          getUserLikeLists(uid),
        ]);

        const tracks = tracksRes.data.songs ?? [];

        if (tracks.length > 0) {
          const userStore = useUserStore.getState();
          const playerStore = usePlayerStore.getState();

          // 1. 同步全量歌曲和喜欢列表到 UserStore (保持和 PlaylistPage 一致的联动)
          userStore.setAlbumList(tracks);
          if (likeListsRes?.data?.ids) {
            userStore.setLikeListIDs(likeListsRes.data.ids);
          }

          // 2. 设置播放队列并播放第一首
          playerStore.setQueue(tracks.map(pruneSongDetail), 0);
          await playerStore.playQueueIndex(0);

          // 3. 跳转播放页面
          smartRouter.push(`/playlist/?id=${playlistID}`);
        } else {
          toast.error(t("sidebar.lib.noTracks"), { id: "play-playlist" });
        }
      } catch (error) {
        console.error("Failed to play playlist:", error);
        toast.error(t("sidebar.lib.fetchTracksFailed"), { id: "play-playlist" });
      }
    });
  };
}
