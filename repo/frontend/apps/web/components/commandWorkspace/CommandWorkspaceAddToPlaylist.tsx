"use client";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";
import { useSongContextMenuActions } from "@/hooks/song/useSongContextMenuActions";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/song/api";

export function CommandWorkspaceAddToPlaylist({ onClose }: CommandWorkspaceNowPlayingProps) {
  const { t } = useTranslation();
  const song = usePlayerStore((state) => state.currentSongDetail);
  if (!song || song.voiceId !== undefined) return null;
  const track = { title: song.name };

  return (
    <div className="text-content">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t("contextMenu.addToPlaylist")}</h2>
          <p className="truncate text-xs text-content-muted">{track.title}</p>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={t("folia.ui.close")}
          className="grid size-8 shrink-0 place-items-center rounded hover:bg-content/10"
        >
          <X className="size-4" />
        </button>
      </header>
      <PlaylistChoices song={song} />
    </div>
  );
}

function PlaylistChoices({ song }: { song: SongDetail }) {
  const { t, filteredPlaylists, handleAddToPlaylist, isLogin, isPlaylistPending } =
    useSongContextMenuActions({
      song,
      isActive: true,
      isPlaying: false,
      isContextMenuOpen: false,
      isCreateDialogOpen: false,
      setIsCreateDialogOpen: () => undefined,
      onPlay: () => undefined,
    });

  if (!isLogin || !filteredPlaylists.length) {
    return <p className="px-4 py-6 text-sm text-content-muted">{t("song.similar.noPlaylists")}</p>;
  }
  return (
    <div className="scrollbar-thin max-h-[min(50vh,24rem)] space-y-0.5 overflow-y-auto p-2">
      {filteredPlaylists.map((playlist) => (
        <button
          key={playlist.id}
          type="button"
          className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-content/10 disabled:opacity-40"
          disabled={isPlaylistPending}
          onClick={() => void handleAddToPlaylist(playlist)}
        >
          {playlist.name}
        </button>
      ))}
    </div>
  );
}
