"use client";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CommandWorkspaceNowPlayingProps } from "@/types/commandWorkspace/model";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useLibraryPlaylistsQuery } from "@/hooks/library/useLibraryPlaylists";
import { useLibraryPlaylistActions } from "@/hooks/library/useLibraryPlaylistActions";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { usePlayerStore } from "@/store/module/player";
import { toast } from "sonner";

export function CommandWorkspaceAddToPlaylist({ onClose }: CommandWorkspaceNowPlayingProps) {
  const { t } = useTranslation();
  const track = usePlayerStore((state) => state.currentTrack);
  const { isLoggedIn, profile } = useActiveAccount();
  const provider = useActiveProvider();
  if (!track || !isLoggedIn || track.ref.provider !== provider.provider) return null;

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
      <QueryBoundary
        resetKey={`capsule-playlist:${provider.provider}:${profile?.accountId ?? ""}:${track.ref.id}`}
        compact
      >
        <PlaylistChoices />
      </QueryBoundary>
    </div>
  );
}

function PlaylistChoices() {
  const { t } = useTranslation();
  const track = usePlayerStore((state) => state.currentTrack);
  const library = useLibraryPlaylistsQuery(true);
  const { addTracks } = useLibraryPlaylistActions();

  if (!library.data) {
    return (
      <p className="px-4 py-6 text-sm text-content-muted">
        {library.fetchStatus === "paused"
          ? t("network.recovery.waiting")
          : t("common.status.loading")}
      </p>
    );
  }

  const ownPlaylists = library.data.filter(
    (item) => item.relation === "created" && !item.isLikedList,
  );
  if (!ownPlaylists.length) {
    return <p className="px-4 py-6 text-sm text-content-muted">{t("song.similar.noPlaylists")}</p>;
  }
  return (
    <div className="scrollbar-thin max-h-[min(50vh,24rem)] space-y-0.5 overflow-y-auto p-2">
      {ownPlaylists.map(({ playlist }) => (
        <button
          key={playlist.ref.id}
          type="button"
          className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-content/10 disabled:opacity-40"
          disabled={!track || addTracks.isPending}
          onClick={() => {
            if (!track) return;
            addTracks.mutate(
              { playlist: playlist.ref, tracks: [track.ref] },
              {
                onSuccess: () => toast.success(t("playlist.table.addToPlaylistSuccess")),
                onError: () => toast.error(t("playlist.table.addToPlaylistFailed")),
              },
            );
          }}
        >
          {playlist.title}
        </button>
      ))}
    </div>
  );
}
