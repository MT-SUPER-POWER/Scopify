// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, Trash2 } from "lucide-react";
import { useUpdatesStore } from "@/store/module/updates";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import { Button } from "@scopify/ui/shadcn/components/button";
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
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store";
import { useTranslation } from "react-i18next";
import type { MusicResourceRef } from "@scopify/music-domain/identity";
import type { SidebarConfirmDialogProps, SidebarMenuProps } from "@/types/sidebar/components";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { getSizedImageUrl } from "@/lib/music/imageUrl";

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
          "w-96 rounded-xl border-none bg-surface-overlay p-8 shadow-floating",
          "flex flex-col",
        )}
      >
        {/* text-center 覆盖 shadcn AlertDialogHeader 默认的 text-left */}
        <AlertDialogHeader className="mb-8 w-full space-y-2">
          <AlertDialogTitle className="w-full text-center text-2xl font-bold tracking-tight text-content">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-content-muted">
            {content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* sm:flex-col 覆盖 shadcn Footer 默认在宽屏变 flex-row 的行为 */}
        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-brand py-3.5 text-base font-bold text-brand-foreground transition-all hover:bg-brand-hover"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-full border-content-muted bg-transparent py-3.5 text-base font-bold text-content transition-all hover:border-content"
          >
            {cancelText}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SidebarMenu({ isCollapsed = false }: SidebarMenuProps) {
  const { t } = useTranslation();
  const canManagePlaylists = useProviderCapability("playlist.manage");
  const showPlaylistActions = useActiveAccount().isLoggedIn && canManagePlaylists;
  const { create, remove } = useLibraryPlaylistActions();
  // Only playlists the account made can be deleted here; saved ones are removed from the list.
  const ownPlaylists = (useLibraryPlaylistsQuery().data ?? []).filter(
    (item) => item.relation === "created" && !item.isLikedList,
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{
    ref: MusicResourceRef<"playlist">;
    name: string;
  } | null>(null);

  const handleCreate = async () => {
    const name = t("sidebar.lib.untitledPlaylist");
    try {
      await create.mutateAsync({ name });
      toast.success(t("sidebar.menu.createSuccess", { name }));
    } catch {
      toast.error(t("sidebar.menu.createFailed"));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { ref, name } = pendingDelete;
    setConfirmOpen(false);
    setPendingDelete(null);
    try {
      await remove.mutateAsync(ref);
      toast.success(t("sidebar.menu.deleteSuccess", { name }));
    } catch {
      toast.error(t("sidebar.menu.deleteFailed"));
    }
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
            size="icon-sm"
            title={t("sidebar.menu.sidebarTitle")}
            aria-label={t("sidebar.menu.sidebarTitle")}
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
            <DropdownMenuItem onSelect={() => useUpdatesStore.getState().open()}>
              <Sparkles className="mr-2 size-5" />
              <span>{t("updates.title")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {/* Group -- Playlist Function；未登录时整组不渲染，分隔线随组一起隐藏 */}
          {showPlaylistActions && (
            <DropdownMenuGroup className="">
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="dropdown-menu-label-momo mt-1">
                {t("sidebar.menu.playlistTitle")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem disabled={create.isPending} onClick={() => void handleCreate()}>
                <Plus className="mr-2 size-5" />
                <span>{t("sidebar.menu.createPlaylist")}</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Trash2 className="mr-2 size-5 text-danger" />
                  <span className="text-danger">{t("sidebar.menu.deletePlaylist")}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {ownPlaylists.map(({ playlist }) => (
                    <DropdownMenuItem
                      key={playlist.ref.id}
                      onSelect={(e) => {
                        e.preventDefault(); // 防止对话框弹出时 Dropdown 抢夺焦点导致关闭
                        setPendingDelete({ ref: playlist.ref, name: playlist.title });
                        setConfirmOpen(true);
                      }}
                    >
                      {playlist.coverUrl && (
                        <Image
                          width={24}
                          height={24}
                          src={getSizedImageUrl(playlist.coverUrl, 80)}
                          alt={t("playlist.form.coverAlt")}
                          className="mr-2 size-6 rounded-sm"
                        />
                      )}
                      <span>{playlist.title}</span>
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

export const SidebarMenuMemo = React.memo(SidebarMenu);
