"use client";

import { Heart } from "lucide-react";
import { LibraryErrorPage } from "@/components/library/LibraryErrorPage";
import { LibraryStatePage } from "@/components/library/LibraryStatePage";
import { PlaylistContent } from "@/components/Playlist/PlaylistContent";
import { PlaylistViewLoading } from "@/components/Playlist/lattice/PlaylistViewLoading";
import { PlaylistPageSkeleton } from "@/components/Playlist/PlaylistPageSkeleton";
import { QuietState } from "@/components/shared/QuietState";
import { useLikedPlaylistQuery } from "@/hooks/library/useLibraryPlaylists";
import { usePlaylist } from "@/hooks/playlist/usePlaylistData";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useTranslation } from "react-i18next";

export default function LikedSongsPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useActiveAccount();
  const likedPlaylistQuery = useLikedPlaylistQuery();
  const likedPlaylistId = likedPlaylistQuery.data?.playlist.ref.id;
  const playlist = usePlaylist(likedPlaylistId ?? null);

  if (!isLoggedIn) {
    return (
      <LibraryStatePage>
        <QuietState icon={Heart} title={t("library.loggedOut.liked")} />
      </LibraryStatePage>
    );
  }

  if (likedPlaylistQuery.isLoading)
    return (
      <>
        <PlaylistPageSkeleton />
        <PlaylistViewLoading />
      </>
    );

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
