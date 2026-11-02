"use client";

import { Heart } from "lucide-react";
import { LibraryErrorPage } from "@/components/library/LibraryErrorPage";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { QuietState } from "@/components/shared/QuietState";
import { useLikedPlaylistQuery } from "@/hooks/library/useLibraryQueries";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useTranslation } from "react-i18next";

export default function LikedSongsPage() {
  const { t } = useTranslation();
  const isLoggedIn = useLoginStatus();
  const likedPlaylistQuery = useLikedPlaylistQuery();
  const likedPlaylistId = likedPlaylistQuery.data?.id;
  const playlist = usePlaylist(likedPlaylistId ? String(likedPlaylistId) : null);

  if (!isLoggedIn) {
    return (
      <LibraryStatePage>
        <QuietState icon={Heart} title={t("library.loggedOut.liked")} />
      </LibraryStatePage>
    );
  }

  if (likedPlaylistQuery.isLoading) return <PlaylistPageSkeleton />;

  if (likedPlaylistQuery.isError) {
    return (
      <LibraryErrorPage
        isRetrying={likedPlaylistQuery.isRefetching}
        onRetry={() => void likedPlaylistQuery.refetch()}
      />
    );
  }

  if (!likedPlaylistId) {
    return (
      <LibraryStatePage>
        <QuietState
          icon={Heart}
          title={t("library.empty.liked.title")}
          description={t("library.empty.liked.description")}
        />
      </LibraryStatePage>
    );
  }

  return <PlaylistContent {...playlist} playSourceId={playlist.playlistId} />;
}
