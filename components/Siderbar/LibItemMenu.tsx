// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Edit, Eye, Link, Play, Trash } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  delPlaylist,
  getPlaylistAllTracks,
  getUserLikeLists,
  updatePlaylist,
  updatePlaylistCover,
} from "@/lib/api/playlist";
import { translate } from "@/lib/i18n";
import { getUserPlaylist } from "@/lib/api/user";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n, useI18nStore } from "@/store/module/i18n";
import type { LibItemMenuProps } from "@/types/components/Siderbar";
import { UpdatePlaylistDialog } from "../Playlist/PlaylistForm";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleDeletePlaylist(playlistId: string | number, playlistName: string): void {
  const locale = useI18nStore.getState().locale;
  delPlaylist(playlistId).then((res) => {
    if (res.data.code === 200) {
      // 成功删除后更新用户歌单列表
      const userStore = useUserStore.getState();
      const updatedPlaylists = userStore.playlist.filter((p) => p.id !== playlistId);
      userStore.setPlayList(updatedPlaylists);
      toast.success(translate(locale, "sidebar.menu.deleteSuccess", { name: playlistName }));
    } else {
      console.error("删除歌单失败:", res.data.message);
      toast.error(translate(locale, "sidebar.menu.deleteFailed"));
    }
  });
}

function handleUpdatePlaylist(
  id: number | string,
  name: string,
  desc?: string,
  coverFile?: File | null,
): void {
  const locale = useI18nStore.getState().locale;
  const updateTasks = [updatePlaylist(id, name, desc)];

  if (coverFile) {
    updateTasks.push(updatePlaylistCover(id, coverFile));
  }

  Promise.all(updateTasks)
    .then((results) => {
      const allSuccess = results.every((res) => res.data.code === 200);
      if (allSuccess) {
        const userStore = useUserStore.getState();
        const uid = userStore.user?.userId;
        if (uid) {
          getUserPlaylist(uid).then((reFetchRes) => {
            if (reFetchRes.data.code === 200) {
              userStore.setPlayList(reFetchRes.data.playlist);
            }
          });
          toast.success(translate(locale, "sidebar.lib.updateSuccess", { name }));
        }
      } else {
        const errorRes = results.find((res) => res.data.code !== 200);
        console.error("更新歌单部分失败:", errorRes?.data?.message);
        toast.error(errorRes?.data?.message || translate(locale, "sidebar.lib.updateFailed"));
      }
    })
    .catch((e) => {
      console.error("更新歌单出错:", e);
      toast.error(translate(locale, "sidebar.lib.updateUnexpectedError"));
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPOENNT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfirmDialogShandCN({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
}: {
  open: boolean;
  title: string;
  content: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <AlertDialogContent
        className={cn("bg-[#282828] border-none shadow-2xl rounded-xl w-96 p-8", "flex flex-col")}
      >
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="space-y-2 mb-8 w-full">
          <AlertDialogTitle className="w-full text-2xl font-bold text-white tracking-tight text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#b3b3b3] text-sm">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex flex-col gap-4 w-full sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-base transition-all"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white text-white font-bold text-base transition-all"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LibItemContextMenu({ children, playlistID }: LibItemMenuProps) {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();

  const userPlaylists = useUserStore((s) => s.playlist);
  const playlistInfo = userPlaylists.find((p) => String(p.id) === String(playlistID));

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [updateFormOpen, setUpdateFormOpen] = React.useState(false);

  const handleConfirmDelete = async () => {
    handleDeletePlaylist(playlistID, playlistInfo?.name || t("sidebar.lib.untitledPlaylist"));
    setConfirmOpen(false);
  };

  const handleConfirmUpdate = (
    id: number | string,
    name: string,
    desc?: string,
    coverFile?: File | null,
  ) => {
    handleUpdatePlaylist(id, name, desc, coverFile);
    setUpdateFormOpen(false);
  };

  return (
    <>
      <ConfirmDialogShandCN
        open={confirmOpen}
        title={t("sidebar.lib.deleteConfirmTitle")}
        content={t("sidebar.lib.deleteConfirmContent", {
          name: playlistInfo?.name || t("sidebar.lib.untitledPlaylist"),
        })}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <UpdatePlaylistDialog
        open={updateFormOpen}
        initialData={playlistInfo}
        onConfirm={async (data) => {
          handleConfirmUpdate(playlistID, data.name, data.desc, data.coverFile);
        }}
        onCancel={() => setUpdateFormOpen(false)}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {/* 歌单和播放快捷 */}
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                smartRouter.push(`/playlist/?id=${playlistID}`);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("contextMenu.view")}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={async () => {
                try {
                  const uid = useUserStore.getState().user?.userId;
                  const [tracksRes, likeListsRes] = await Promise.all([
                    getPlaylistAllTracks({ id: playlistID }),
                    getUserLikeLists(uid!),
                  ]);

                  const tracks = tracksRes.data?.songs || [];

                  if (tracks.length > 0) {
                    const userStore = useUserStore.getState();
                    const playerStore = usePlayerStore.getState();

                    // 1. 同步全量歌曲和喜欢列表到 UserStore (保持和 PlaylistPage 一致的联动)
                    userStore.setAlbumList(tracks);
                    if (likeListsRes?.data?.ids) {
                      userStore.setLikeListIDs(likeListsRes.data.ids);
                    }

                    // 2. 设置播放队列并播放第一首
                    playerStore.setQueue(tracks, 0);
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
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              {t("contextMenu.play")}
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          {/* 杂项，未来拓展 */}
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                const url = `https://music.163.com/#/playlist?id=${playlistID}`;
                navigator.clipboard.writeText(url);
                toast.success(t("sidebar.lib.playlistLinkCopied"));
              }}
            >
              <Link className="w-4 h-4 mr-2" />
              {t("contextMenu.copyPlaylistLink")}
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          {/* 歌单操作 */}
          <ContextMenuGroup>
            <ContextMenuItem
              onClick={() => {
                setUpdateFormOpen(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t("contextMenu.updatePlaylist")}
            </ContextMenuItem>

            <ContextMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
              variant="destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              {t("contextMenu.deletePlaylist")}
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

export default React.memo(LibItemContextMenu);
