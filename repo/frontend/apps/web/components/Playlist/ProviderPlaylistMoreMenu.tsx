"use client";

import { Bookmark, BookmarkMinus, Edit, Link, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SidebarPlaylistConfirmDialog } from "@/components/Sidebar/SidebarPlaylistConfirmDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useProviderCapability, useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { PlaylistMoreMenuProps } from "@/types/playlist/components";

/**
 * The basics of a playlist on platforms without NetEase's full editor: rename and delete one
 * the account created, save or unsave someone else's, and copy its link.
 */
export function ProviderPlaylistMoreMenu({
  playlistId,
  playlistInfo,
  isSticky,
}: PlaylistMoreMenuProps) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const smartRouter = useSmartRouter();
  const canManage = useProviderCapability("playlist.manage");
  const library = useLibraryPlaylistsQuery(true);
  const { remove, rename, subscribe } = useLibraryPlaylistActions();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const ref = { provider: provider.provider, kind: "playlist" as const, id: playlistId };
  const entry = library.data?.find((item) => item.playlist.ref.id === playlistId);
  // The liked list is the platform's own; it can be neither renamed nor deleted.
  const isOwn = canManage && entry?.relation === "created" && !entry.isLikedList;
  const isSaved = canManage && entry?.relation === "subscribed";
  const canSave = canManage && entry === undefined && provider.setPlaylistSubscribed !== undefined;
  const shareUrl = provider.getPlaylistShareUrl?.(ref) ?? null;
  const busy = remove.isPending || rename.isPending || subscribe.isPending;

  if (!isOwn && !isSaved && !canSave && !shareUrl) return null;

  const confirmRename = async () => {
    const next = name.trim();
    if (!next || next === playlistInfo.title) {
      setRenaming(false);
      return;
    }
    try {
      await rename.mutateAsync({ playlist: ref, name: next });
      toast.success(t("sidebar.lib.updateSuccess", { name: next }));
      setRenaming(false);
    } catch {
      toast.error(t("sidebar.lib.updateFailed"));
    }
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(ref);
      toast.success(t("sidebar.menu.deleteSuccess", { name: playlistInfo.title }));
      setDeleting(false);
      smartRouter.push("/");
    } catch {
      toast.error(t("sidebar.menu.deleteFailed"));
    }
  };

  const toggleSaved = async (subscribed: boolean) => {
    try {
      await subscribe.mutateAsync({ playlist: ref, subscribed });
      toast.success(
        t(subscribed ? "playlist.actions.subscribeSuccess" : "playlist.actions.unsubscribeSuccess"),
      );
    } catch {
      toast.error(t("playlist.table.operationFailed"));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("playlist.actions.more")}
            title={t("playlist.actions.more")}
            className="inline-flex cursor-pointer items-center justify-center rounded-sm text-content-muted transition-colors outline-none hover:text-content focus-visible:ring-2 focus-visible:ring-brand"
          >
            <MoreHorizontal className={cn(isSticky ? "size-7" : "size-8")} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={8} className="w-48">
          {isOwn && provider.renamePlaylist && (
            <DropdownMenuItem
              disabled={busy}
              onSelect={() => {
                setName(playlistInfo.title);
                setRenaming(true);
              }}
            >
              <Edit className="size-4" />
              {t("sidebar.lib.renameTitle")}
            </DropdownMenuItem>
          )}
          {isSaved && (
            <DropdownMenuItem disabled={busy} onSelect={() => void toggleSaved(false)}>
              <BookmarkMinus className="size-4" />
              {t("playlist.actions.unsubscribe")}
            </DropdownMenuItem>
          )}
          {canSave && (
            <DropdownMenuItem disabled={busy} onSelect={() => void toggleSaved(true)}>
              <Bookmark className="size-4" />
              {t("playlist.actions.subscribe")}
            </DropdownMenuItem>
          )}
          {shareUrl && (
            <DropdownMenuItem
              onSelect={() => {
                void navigator.clipboard
                  .writeText(shareUrl)
                  .then(() => toast.success(t("sidebar.lib.playlistLinkCopied")))
                  .catch(() => toast.error(t("playlist.table.operationFailed")));
              }}
            >
              <Link className="size-4" />
              {t("contextMenu.copyPlaylistLink")}
            </DropdownMenuItem>
          )}
          {isOwn && provider.deletePlaylist && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={busy}
                onSelect={() => setDeleting(true)}
              >
                <Trash2 className="size-4" />
                {t("contextMenu.deletePlaylist")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={renaming} onOpenChange={(open) => !open && !busy && setRenaming(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              {t("sidebar.lib.renameTitle")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("sidebar.lib.renamePlaceholder")}
            disabled={rename.isPending}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && !rename.isPending) {
                event.preventDefault();
                void confirmRename();
              }
            }}
          />
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(false)} disabled={rename.isPending}>
              {t("common.action.cancel")}
            </Button>
            <Button
              onClick={() => void confirmRename()}
              disabled={rename.isPending || !name.trim()}
            >
              {t("common.action.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarPlaylistConfirmDialog
        open={deleting}
        busy={remove.isPending}
        title={t("sidebar.lib.deleteConfirmTitle")}
        content={t("sidebar.lib.deleteConfirmContent", { name: playlistInfo.title })}
        confirmText={t("common.action.confirm")}
        cancelText={t("common.action.cancel")}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !remove.isPending && setDeleting(false)}
      />
    </>
  );
}
