"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { createPlaylist } from "@/lib/api/playlist";
import { updatePlaylistTrack } from "@/lib/api/track";
import { clearPageCache } from "@/lib/cache/pageCache";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";

export interface CreatePlaylistFromTracksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracks: SongDetail[];
}

export function CreatePlaylistFromTracksDialog({
  open,
  onOpenChange,
  tracks,
}: CreatePlaylistFromTracksDialogProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [playlistName, setPlaylistName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultName =
    tracks.length > 0
      ? `${tracks[0].name} 等 ${tracks.length} 首歌曲`
      : t("sidebar.lib.untitledPlaylist");

  const handleConfirm = async () => {
    const finalName = playlistName.trim() || defaultName;
    setIsSubmitting(true);
    const toastId = toast.loading(`正在创建歌单「${finalName}」...`);

    try {
      const res = await createPlaylist(finalName, "0");
      if (res.data.code === 200 && res.data.playlist) {
        const newPlaylist = res.data.playlist;
        const userStore = useUserStore.getState();
        userStore.setPlayList([newPlaylist, ...userStore.playlist]);

        // 批量将选中的歌曲添加进新歌单
        if (tracks.length > 0) {
          await updatePlaylistTrack({
            operation: "add",
            playlistId: newPlaylist.id,
            trackId: tracks.map((t) => t.id).join(","),
          });
        }

        void clearPageCache();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["library", "playlists"] }),
          queryClient.invalidateQueries({
            queryKey: ["playlist", "content", "playlist", String(newPlaylist.id)],
          }),
        ]);

        toast.success(
          `已创建歌单「${finalName}」并添加了 ${tracks.length} 首歌曲`,
          { id: toastId },
        );
        onOpenChange(false);
        setPlaylistName("");
      } else {
        toast.error(res.data.message || t("sidebar.menu.createFailed"), { id: toastId });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sidebar.menu.createFailed"), {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogOverlay />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">
            {t("sidebar.menu.createPlaylist")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs text-content-muted">
            将选中的 {tracks.length} 首歌曲收纳至新歌单：
          </p>
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
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.action.cancel")}
          </Button>
          <Button
            variant="default"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.status.loading") : t("common.action.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
