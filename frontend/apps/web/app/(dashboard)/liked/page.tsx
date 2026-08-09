"use client";

import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { NetworkRetryState } from "@/components/shared/NetworkRetryState";
import { useLikedPlaylistQuery } from "@/hooks/library/useLibraryQueries";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function LikedSongsPage() {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  const router = useSmartRouter();
  const likedPlaylistQuery = useLikedPlaylistQuery();
  const likedPlaylistId = likedPlaylistQuery.data?.id;
  const playlist = usePlaylist(likedPlaylistId ? String(likedPlaylistId) : null);

  if (!isLoggedIn) {
    return (
      <main className="bg-surface-raised min-h-screen px-6 pt-24 pb-28 md:px-10">
        <LoginRequiredPrompt
          reason="library"
          onLogin={() => router.push("/login?reason=library")}
        />
      </main>
    );
  }

  if (likedPlaylistQuery.isLoading) return <PlaylistPageSkeleton />;

  if (likedPlaylistQuery.isError) {
    return (
      <main className="bg-surface-raised min-h-screen px-6 pt-24 pb-28 md:px-10">
        <NetworkRetryState
          title={t("network.offline.title")}
          subtitle={t("network.offline.subtitle")}
          actionLabel={t("network.action.refresh")}
          isRetrying={likedPlaylistQuery.isRefetching}
          onRetry={() => void likedPlaylistQuery.refetch()}
        />
      </main>
    );
  }

  if (!likedPlaylistId) {
    return (
      <main className="bg-surface-raised min-h-screen px-6 pt-24 pb-28 md:px-10">
        <LibraryEmptyState
          title={t("library.empty.liked.title")}
          description={t("library.empty.liked.description")}
        />
      </main>
    );
  }

  return <PlaylistContent {...playlist} playSourceId={playlist.playlistId} />;
}
