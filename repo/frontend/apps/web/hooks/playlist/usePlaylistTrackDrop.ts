"use client";

import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePlaylistTrackMutation } from "@/hooks/playlist/usePlaylistTrackMutation";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getPlaylistOrderIds } from "@/lib/playlist/playlistOrder";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import { isApiError } from "@/lib/web/apiError";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useUserStore } from "@/store";
import { useAppDragStore } from "@/store/module/appDrag";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistDropRequest } from "@/types/trackDrag";

export function usePlaylistTrackDrop() {
  const mutation = usePlaylistTrackMutation();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return async ({ playlistId, tracks }: PlaylistDropRequest) => {
    const targetId = `playlist:${playlistId}`;
    const drag = useAppDragStore.getState();
    if (!tracks.length || drag.pendingTargetIds.includes(targetId)) return;
    const user = useUserStore.getState().user;
    if (!isRealUser(user)) {
      toast.error(t("sidebar.card.loginTitle"));
      return;
    }
    drag.setTargetPending(targetId, true);
    const toastId = toast.loading(t("playlist.drop.adding"));
    try {
      const { data } = await getPlaylsitDetail({ id: playlistId, requiresMusicSession: true });
      if (data.code !== 200 || !data.playlist) throw new Error(t("playlist.drop.loadFailed"));
      if (data.playlist.creator?.userId !== user?.userId) {
        throw new Error(t("playlist.order.notOwner"));
      }
      const existing = new Set(getPlaylistOrderIds(data.playlist.trackIds));
      if (data.playlist.trackCount !== undefined && existing.size !== data.playlist.trackCount) {
        throw new Error(t("playlist.order.incomplete"));
      }
      const ids = [...new Set(tracks.map((track) => track.id))];
      const added = ids.filter((id) => !existing.has(id));
      const skipped = ids.length - added.length;
      if (!added.length) {
        toast.info(t("playlist.drop.duplicate"), { id: toastId });
        void queryClient.invalidateQueries({ queryKey: ["playlist", "content", "playlist", String(playlistId)] });
        return;
      }
      if (useUserStore.getState().user?.userId !== user?.userId) {
        throw new Error(t("sidebar.card.loginTitle"));
      }
      await mutation.mutateAsync({ operation: "add", playlistId, trackId: added.join(",") });
      toast.success(
        skipped
          ? t("playlist.drop.partial", { count: added.length, skipped })
          : t("playlist.drop.success", { count: added.length }),
        { id: toastId },
      );
    } catch (error) {
      const payload = isApiError(error) ? error.data : undefined;
      const duplicate = payload && typeof payload === "object" && "code" in payload && payload.code === 502;
      if (duplicate) toast.info(t("playlist.drop.concurrentDuplicate"), { id: toastId });
      else toast.error(t("playlist.table.addToPlaylistFailed"), {
        id: toastId,
        description: error instanceof Error ? error.message : undefined,
      });
      // A timeout or a concurrent edit can leave the remote result uncertain.
      await clearPageCache().catch(() => undefined);
      void queryClient.invalidateQueries({ queryKey: ["playlist", "content", "playlist", String(playlistId)] });
      void queryClient.invalidateQueries({ queryKey: ["library", "playlists"] });
    } finally {
      useAppDragStore.getState().setTargetPending(targetId, false);
    }
  };
}
