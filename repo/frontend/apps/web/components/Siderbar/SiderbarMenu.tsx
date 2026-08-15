// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPlaylist, delPlaylist } from "@/lib/api/playlist";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUiStore, useUserStore } from "@/store";
import { useI18n, useI18nStore } from "@/store/module/i18n";
import type { SidebarConfirmDialogProps } from "@/types/components/sidebar";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "../ui/alert-dialog";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleCreatePlaylist(
  playlistName: string,
  privacy: "0" | "10",
  queryClient?: QueryClient,
): void {
  const locale = useI18nStore.getState().locale;
  createPlaylist(playlistName, privacy).then((res) => {
    if (res.data.code === 200) {
      // 成功创建后更新用户歌单列表
      const newPlaylist = res.data.playlist;
      const userStore = useUserStore.getState();
      userStore.setPlayList([...userStore.playlist, newPlaylist]);
      void clearPageCache();
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ["library", "playlists"] });
      }
      toast.success(translate(locale, "sidebar.menu.createSuccess", { name: playlistName }));
    } else {
      console.error("创建歌单失败:", res.data.message);
      toast.error(translate(locale, "sidebar.menu.createFailed"));
    }
  });
}

function handleDeletePlaylist(
  playlistId: string | number,
  playlistName: string,
  queryClient?: QueryClient,
): void {
  const locale = useI18nStore.getState().locale;
  delPlaylist(playlistId).then((res) => {
    if (res.data.code === 200) {
      // 成功删除后更新用户歌单列表
      const userStore = useUserStore.getState();
      const updatedPlaylists = userStore.playlist.filter((p) => p.id !== playlistId);
      userStore.setPlayList(updatedPlaylists);
      void clearPageCache();
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ["library", "playlists"] });
        void queryClient.invalidateQueries({
          queryKey: ["playlist", "content", "playlist", String(playlistId)],
        });
      }
      toast.success(translate(locale, "sidebar.menu.deleteSuccess", { name: playlistName }));
    } else {
      console.error("删除歌单失败:", res.data.message);
      toast.error(translate(locale, "sidebar.menu.deleteFailed"));
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPOENNT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConfirmDialogShandCN({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: SidebarConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogOverlay className="backdrop-blur-sm" />
      <AlertDialogContent
        className={cn(
          "bg-surface-overlay shadow-floating w-96 rounded-xl border-none p-8",
          "flex flex-col",
        )}
      >
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="mb-8 w-full space-y-2">
          <AlertDialogTitle className="text-content w-full text-center text-2xl font-bold tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-content-muted text-sm">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="bg-brand text-brand-foreground hover:bg-brand-hover w-full rounded-full py-3.5 text-base font-bold transition-all"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border-content-muted text-content hover:border-content w-full rounded-full bg-transparent py-3.5 text-base font-bold transition-all"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SiderBarMenuProps {
  isCollapsed?: boolean;
}

function SiderBarMenu({ isCollapsed = false }: SiderBarMenuProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isLoggedIn = useLoginStatus();
  const userPlaylists = useUserStore((s) => s.playlist);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{
    id: number | string;
    name: string;
  } | null>(null);

  const handleDeleteClick = (id: number | string, name: string) => {
    setPendingDelete({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    handleDeletePlaylist(pendingDelete.id, pendingDelete.name, queryClient);
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
    <>
      <ConfirmDialogShandCN
        open={confirmOpen}
        title={t("sidebar.menu.deleteConfirmTitle")}
        content={t("sidebar.menu.deleteConfirmContent", { name: pendingDelete?.name ?? "" })}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon-sm" : "default"}
            title={t("sidebar.menu.sidebarTitle")}
          >
            <Menu className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="start">
          {/* Group -- Sider Function */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
              {t("sidebar.menu.sidebarTitle")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isCollapsed ? (
              <DropdownMenuItem onClick={() => useUiStore.getState().setIsCollapsed(false)}>
                <PanelLeftOpen className="mr-2 size-5 transition-transform hover:scale-110 active:scale-95" />
                <span>{t("sidebar.filter.expand")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => useUiStore.getState().setIsCollapsed(true)}>
                <PanelLeftClose className="mr-2 size-5 transition-transform hover:scale-110 active:scale-95" />
                <span>{t("sidebar.menu.collapse")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {/* Group -- Playlist Function */}
          {isLoggedIn && (
            <DropdownMenuGroup className="">
              <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
                {t("sidebar.menu.playlistTitle")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() =>
                  handleCreatePlaylist(t("sidebar.lib.untitledPlaylist"), "0", queryClient)
                }
              >
                <Plus className="mr-2 size-5" />
                <span>{t("sidebar.menu.createPlaylist")}</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Trash2 className="text-danger mr-2 size-5" />
                  <span className="text-danger">{t("sidebar.menu.deletePlaylist")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {userPlaylists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.id}
                      onSelect={(e) => {
                        e.preventDefault(); // 防止对话框弹出时 Dropdown 抢夺焦点导致关闭
                        handleDeleteClick(playlist.id, playlist.name);
                      }}
                    >
                      <Image
                        width={24}
                        height={24}
                        src={playlist.coverImgUrl}
                        alt={t("playlist.form.coverAlt")}
                        className="mr-2 size-6 rounded-sm"
                      />
                      <span>{playlist.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export const SiderBarMenuMemo = React.memo(SiderBarMenu);
