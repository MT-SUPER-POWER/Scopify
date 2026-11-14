"use client";

import { Bookmark } from "lucide-react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { QuietState } from "@/components/shared/QuietState";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useHomePlaybackActions } from "@/hooks/home/useHomePlaybackActions";
import { useCollectionQuery, useUserPlaylistsQuery } from "@/hooks/library/useLibraryQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useUserStore } from "@/store";
import { useTranslation } from "react-i18next";
import { CollectionShelf } from "./_components/CollectionShelf";

export default function CollectionPage() {
  const { t } = useTranslation();
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);
  const actions = useHomePlaybackActions();
  const playlistsQuery = useUserPlaylistsQuery();
  const collectionQuery = useCollectionQuery();

  const playlists = (playlistsQuery.data ?? [])
    .filter((playlist) => playlist.specialType !== 5 && playlist.creator.userId !== userId)
    .map((playlist) => ({
      id: String(playlist.id),
      title: playlist.name,
      coverUrl: getSizedImageUrl(playlist.coverImgUrl, 300),
      subtitle: [
        t("home.playlistSummary", { count: playlist.trackCount }),
        playlist.creator.nickname,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/playlist?id=${playlist.id}`,
      isLoading: actions.loadingPlayId === `playlist-${playlist.id}`,
      onPlay: (event: React.MouseEvent) => void actions.handlePlayPlaylist(playlist.id, event),
    }));
  const albums = (collectionQuery.data?.albums ?? []).map((album) => ({
    ...album,
    id: String(album.id),
    coverUrl: album.coverUrl ?? "",
    isLoading: actions.loadingPlayId === `album-${album.id}`,
    onPlay: (event: React.MouseEvent) => void actions.handlePlayAlbum(Number(album.id), event),
  }));
  const artists = (collectionQuery.data?.artists ?? []).map((artist) => ({
    ...artist,
    id: String(artist.id),
    coverUrl: artist.coverUrl ?? "",
  }));
  const isEmpty =
    playlistsQuery.isSuccess &&
    collectionQuery.isSuccess &&
    playlists.length + albums.length + artists.length === 0;

  return (
    <>
      <header className="pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-content">
          {t("library.title.collection")}
        </h1>
      </header>
      {!isLoggedIn ? (
        <QuietState icon={Bookmark} title={t("library.loggedOut.collection")} />
      ) : isEmpty ? (
        <QuietState
          icon={Bookmark}
          title={t("library.empty.collection.title")}
          description={t("library.empty.collection.description")}
        />
      ) : (
        <div className="space-y-10">
          <LibraryContentState
            hasItems={playlists.length > 0}
            isError={playlistsQuery.isError && playlistsQuery.data === undefined}
            isLoading={playlistsQuery.isLoading}
            isRetrying={playlistsQuery.isRefetching}
            emptyState={null}
            onRetry={() => void playlistsQuery.refetch()}
          >
            <CollectionShelf title={t("library.collection.tab.playlists")} items={playlists} />
          </LibraryContentState>
          <LibraryContentState
            hasItems={albums.length + artists.length > 0}
            isError={collectionQuery.isError && collectionQuery.data === undefined}
            isLoading={collectionQuery.isLoading}
            isRetrying={collectionQuery.isRefetching}
            emptyState={null}
            onRetry={() => void collectionQuery.refetch()}
          >
            <CollectionShelf title={t("library.collection.tab.albums")} items={albums} />
            <CollectionShelf title={t("library.collection.tab.artists")} items={artists} />
          </LibraryContentState>
        </div>
      )}
    </>
  );
}
