import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  delPlaylist,
  subscribePlaylist,
  updatePlaylist,
  updatePlaylistCover,
} from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import { getPlaylistManagementPermissions } from "@/lib/playlist/playlistManagementPermissions";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistUpdateInput } from "@/types/playlist";
import type { RawNeteasePlaylist } from "@/types/api/playlist";

export function usePlaylistManagement(playlistId: number | string, detail?: RawNeteasePlaylist) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const playlists = useUserStore((state) => state.playlist);
  const playlist = detail ?? playlists.find((item) => String(item.id) === String(playlistId));
  const userId = isRealUser(user) ? user?.userId : undefined;
  const permissions = getPlaylistManagementPermissions(playlist, userId);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  const currentPermissions = () => {
    const state = useUserStore.getState();
    const currentPlaylist =
      detail ?? state.playlist.find((item) => String(item.id) === String(playlistId));
    const sameUser = isRealUser(state.user) && state.user?.userId === userId;
    return getPlaylistManagementPermissions(currentPlaylist, sameUser ? userId : undefined);
  };
  const refresh = () => {
    void clearPageCache();
    if (userId)
      void queryClient.invalidateQueries({ queryKey: musicQueryKeys.library.playlists(userId) });
    void queryClient.invalidateQueries({
      queryKey: ["playlist", "content", "playlist", String(playlistId)],
    });
  };

  const remove = async (unsubscribe: boolean) => {
    const allowed = currentPermissions();
    if (pending.current || !(unsubscribe ? allowed.canUnsubscribe : allowed.canManage))
      return false;
    pending.current = true;
    setBusy(true);
    try {
      const response = await (unsubscribe
        ? subscribePlaylist(2, playlistId)
        : delPlaylist(playlistId));
      if (response.data.code !== 200) throw new Error(response.data.message);
      if (useUserStore.getState().user?.userId !== userId) return false;
      const state = useUserStore.getState();
      state.setPlayList(state.playlist.filter((item) => String(item.id) !== String(playlistId)));
      // Remove the entry immediately, then reconcile the subscribed query with the server.
      if (userId)
        queryClient.setQueryData(
          musicQueryKeys.library.playlists(userId),
          (items: typeof playlists | undefined) =>
            items?.filter((item) => String(item.id) !== String(playlistId)),
        );
      refresh();
      toast.success(
        unsubscribe
          ? t("playlist.actions.unsubscribeSuccess")
          : t("sidebar.menu.deleteSuccess", {
              name: playlist?.name ?? t("sidebar.lib.untitledPlaylist"),
            }),
      );
      return true;
    } catch {
      toast.error(
        unsubscribe ? t("sidebar.lib.unsubscribeFailed") : t("sidebar.menu.deleteFailed"),
      );
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const update = async (data: PlaylistUpdateInput) => {
    if (pending.current || !currentPermissions().canManage) return false;
    pending.current = true;
    setBusy(true);
    try {
      const results = await Promise.all([
        updatePlaylist({ id: playlistId, name: data.name, desc: data.desc, tags: data.tags }),
        ...(data.coverFile ? [updatePlaylistCover(playlistId, data.coverFile)] : []),
      ]);
      if (results.some((result) => result.data.code !== 200))
        throw new Error("Playlist update failed");
      if (useUserStore.getState().user?.userId !== userId) return false;
      refresh();
      toast.success(t("sidebar.lib.updateSuccess", { name: data.name }));
      return true;
    } catch {
      refresh();
      toast.error(t("sidebar.lib.updateFailed"));
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return { ...permissions, busy, playlist, remove, update };
}
