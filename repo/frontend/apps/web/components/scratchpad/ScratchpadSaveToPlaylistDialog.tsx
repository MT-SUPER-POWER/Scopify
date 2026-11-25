"use client";

import Image from "next/image";
import { Check, FolderPlus, Music2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { providerLabel } from "@/lib/scratchpad/scratchpadModel";
import { cn } from "@/lib/utils";
import { useScratchpadStore } from "@/store/module/scratchpad";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import type { MusicPlaylist } from "@scopify/music-domain/playlist";

/**
 * 跨音源曲目收藏到歌单弹窗：自动筛出当前激活音源可写入的曲目，
 * 支持添加到已有自建歌单或立即新建歌单，并在保存来自速记簿的曲目时可选自动移出。
 */
export function ScratchpadSaveToPlaylistDialog() {
  const { t } = useTranslation();
  const { open, tracks, source } = useScratchpadStore((s) => s.saveDialog);
  const closeSaveDialog = useScratchpadStore((s) => s.closeSaveDialog);
  const removeKeys = useScratchpadStore((s) => s.removeKeys);

  const provider = useActiveProvider();
  const { isLoggedIn } = useActiveAccount();
  const playlistsQuery = useLibraryPlaylistsQuery();
  const { addTracks, create } = useLibraryPlaylistActions();

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [removeAfterSave, setRemoveAfterSave] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const matchingTracks = useMemo(
    () => tracks.filter((track) => track.ref.provider === provider.provider),
    [provider.provider, tracks],
  );
  const skippedCount = tracks.length - matchingTracks.length;
  const ownPlaylists = useMemo(
    () =>
      (playlistsQuery.data ?? []).filter(
        (item) => item.relation === "created" && !item.isLikedList,
      ),
    [playlistsQuery.data],
  );

  const canManage = isLoggedIn && provider.capabilities.has("playlist.manage");
  const defaultNewName =
    matchingTracks.length > 0
      ? t("scratchpad.defaultPlaylistName", {
          title: matchingTracks[0].title,
          count: matchingTracks.length,
        })
      : t("sidebar.lib.untitledPlaylist");

  const finalize = () => {
    if (source === "scratchpad" && removeAfterSave && matchingTracks.length > 0) {
      const keys = matchingTracks.map((track) =>
        JSON.stringify([track.ref.provider, track.ref.kind, track.ref.id]),
      );
      removeKeys(keys);
    }
    setNewPlaylistName("");
    closeSaveDialog();
  };

  const handleSelectPlaylist = async (playlist: MusicPlaylist) => {
    if (submitting || matchingTracks.length === 0) return;
    setSubmitting(true);
    try {
      await addTracks.mutateAsync({
        playlist: playlist.ref,
        tracks: matchingTracks.map((track) => track.ref),
      });
      toast.success(
        t("scratchpad.toastSavedToPlaylist", {
          count: matchingTracks.length,
          name: playlist.title,
        }),
      );
      finalize();
    } catch {
      toast.error(t("playlist.table.addToPlaylistFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (submitting || matchingTracks.length === 0) return;
    const finalName = newPlaylistName.trim() || defaultNewName;
    setSubmitting(true);
    try {
      await create.mutateAsync({
        name: finalName,
        tracks: matchingTracks.map((track) => track.ref),
      });
      toast.success(
        t("scratchpad.toastSavedToPlaylist", {
          count: matchingTracks.length,
          name: finalName,
        }),
      );
      finalize();
    } catch {
      toast.error(t("sidebar.menu.createFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) closeSaveDialog();
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FolderPlus className="size-4.5 text-brand" />
            <span>{t("scratchpad.saveDialogTitle")}</span>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-xs text-content-muted">
            {t("scratchpad.saveDialogSubtitle", {
              count: matchingTracks.length,
              provider: providerLabel(provider.provider, t),
            })}
          </p>

          {skippedCount > 0 && (
            <div className="rounded-lg border border-border/70 bg-surface-sunken px-3 py-2 text-xs text-content-muted">
              {t("scratchpad.saveDialogSkippedOtherProvider", {
                skipped: skippedCount,
                provider: providerLabel(provider.provider, t),
              })}
            </div>
          )}

          {!canManage ? (
            <div className="rounded-xl border border-border/70 bg-surface-sunken/70 px-4 py-6 text-center text-sm text-content-muted">
              {t("scratchpad.saveDialogLoginRequired")}
            </div>
          ) : matchingTracks.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-surface-sunken/70 px-4 py-6 text-center text-sm text-content-muted">
              {t("scratchpad.saveDialogNoMatchingTracks")}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-content-muted">
                  {t("scratchpad.saveDialogExisting")}
                </p>
                <ScrollArea className="h-48 rounded-lg border border-border/70 bg-surface-sunken/40">
                  <div className="space-y-1 p-1.5">
                    {ownPlaylists.length === 0 ? (
                      <p className="py-8 text-center text-xs text-content-muted">
                        {t("song.similar.noPlaylists")}
                      </p>
                    ) : (
                      ownPlaylists.map(({ playlist }) => (
                        <button
                          key={playlist.ref.id}
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleSelectPlaylist(playlist)}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-content/10 disabled:opacity-50"
                        >
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
                            {playlist.coverUrl ? (
                              <Image
                                fill
                                sizes="72px"
                                src={getSizedImageUrl(playlist.coverUrl, 120)}
                                alt={playlist.title}
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-content-muted">
                                <Music2 className="size-4" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-content">
                              {playlist.title}
                            </p>
                            {playlist.trackCount !== undefined && (
                              <p className="text-[11px] text-content-muted tabular-nums">
                                {t("scratchpad.count", { count: playlist.trackCount })}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2 border-t border-border/60 pt-3">
                <p className="text-xs font-medium text-content-muted">
                  {t("scratchpad.saveDialogCreateNew")}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    placeholder={defaultNewName}
                    disabled={submitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !submitting) {
                        event.preventDefault();
                        void handleCreatePlaylist();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting}
                    onClick={() => void handleCreatePlaylist()}
                  >
                    <Plus className="mr-1 size-4" />
                    <span>{t("scratchpad.createAndSave")}</span>
                  </Button>
                </div>
              </div>

              {source === "scratchpad" && (
                <button
                  type="button"
                  onClick={() => setRemoveAfterSave((value) => !value)}
                  className="flex items-center gap-2 pt-1 text-xs text-content-muted transition-colors hover:text-content"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border transition-colors",
                      removeAfterSave
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface",
                    )}
                  >
                    {removeAfterSave && <Check className="size-3 stroke-[2.5]" />}
                  </span>
                  <span>{t("scratchpad.removeAfterSave")}</span>
                </button>
              )}
            </>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" disabled={submitting} onClick={() => closeSaveDialog()}>
            {t("common.action.cancel")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
