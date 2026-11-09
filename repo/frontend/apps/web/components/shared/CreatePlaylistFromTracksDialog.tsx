"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { useTranslation } from "react-i18next";

import type { CreatePlaylistFromTracksDialogProps } from "@/types/song/contextMenuComponents";

export function CreatePlaylistFromTracksDialog({
  open,
  onOpenChange,
  tracks,
}: CreatePlaylistFromTracksDialogProps) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const { create } = useLibraryPlaylistActions();
  const [playlistName, setPlaylistName] = useState("");
  const isSubmitting = create.isPending;

  const defaultName =
    tracks.length > 0
      ? `${tracks[0].name} 等 ${tracks.length} 首歌曲`
      : t("sidebar.lib.untitledPlaylist");

  const handleConfirm = async () => {
    const finalName = playlistName.trim() || defaultName;
    const toastId = toast.loading(`正在创建歌单「${finalName}」...`);
    try {
      await create.mutateAsync({
        name: finalName,
        // The tracks come from song menus, which list the active platform's songs only.
        tracks: tracks.map((track) => ({
          provider: provider.provider,
          kind: "track" as const,
          id: String(track.id),
        })),
      });
      toast.success(
        tracks.length > 0
          ? `已创建歌单「${finalName}」并添加了 ${tracks.length} 首歌曲`
          : t("sidebar.menu.createSuccess", { name: finalName }),
        { id: toastId },
      );
      onOpenChange(false);
      setPlaylistName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sidebar.menu.createFailed"), {
        id: toastId,
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">
            {t("sidebar.menu.createPlaylist")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {tracks.length > 0 && (
            <p className="text-xs text-content-muted">
              将选中的 {tracks.length} 首歌曲收纳至新歌单：
            </p>
          )}
          <Input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder={defaultName}
            disabled={isSubmitting}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSubmitting) {
                e.preventDefault();
                void handleConfirm();
              }
            }}
          />
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t("common.action.cancel")}
          </Button>
          <Button variant="default" onClick={() => void handleConfirm()} disabled={isSubmitting}>
            {isSubmitting ? t("common.status.loading") : t("common.action.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
