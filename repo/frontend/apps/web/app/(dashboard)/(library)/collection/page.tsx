"use client";

import { Bookmark } from "lucide-react";
import { useMemo } from "react";
import { LibraryContentState } from "@/components/library/LibraryContentState";
import { QuietState } from "@/components/shared/QuietState";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useHomePlaybackActions } from "@/hooks/home/useHomePlaybackActions";
import { useLibraryAlbumsQuery } from "@/hooks/library/useLibraryAlbums";
import {
  useLibraryPlaylistsQuery,
  useLikedPlaylistQuery,
} from "@/hooks/library/useLibraryPlaylists";
import { useFollowedArtistsQuery } from "@/hooks/library/useLibraryQueries";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import { CollectionShelf, type CollectionShelfItem } from "./_components/CollectionShelf";
import { LikedSongsHero } from "./_components/LikedSongsHero";

/** What the account keeps: its liked songs first, then the playlists, albums and artists saved. */
export default function CollectionPage() {
  const { t } = useTranslation();
  const { isLoggedIn } = useActiveAccount();
  const actions = useHomePlaybackActions();
  const likedQuery = useLikedPlaylistQuery();
  const playlistsQuery = useLibraryPlaylistsQuery();
  const albumsQuery = useLibraryAlbumsQuery();
  const artistsQuery = useFollowedArtistsQuery();

  const liked = likedQuery.data;
  const playlists = useMemo<CollectionShelfItem[]>(
    () =>
      (playlistsQuery.data ?? [])
        .filter((item) => item.relation === "subscribed")
        .map((item) => {
          const id = item.playlist.ref.id;
          return {
            id,
            title: item.playlist.title,
            coverUrl: getSizedImageUrl(item.playlist.coverUrl, 300),
            subtitle: [
              t("home.playlistSummary", { count: item.playlist.trackCount }),
              item.playlist.creator?.name,
            ]
              .filter(Boolean)
              .join(" · "),
            href: `/playlist?id=${encodeURIComponent(id)}`,
            isLoading: actions.loadingPlayId === `playlist-${id}`,
            onPlay: (event: React.MouseEvent) => void actions.handlePlayPlaylist(id, event),
          };
        }),
    [actions, playlistsQuery.data, t],
  );
  const albums = useMemo<CollectionShelfItem[]>(
    () =>
      (albumsQuery.data ?? []).map((album) => ({
        id: String(album.id),
        title: album.title,
        coverUrl: album.coverUrl ?? "",
        subtitle: album.subtitle,
        href: album.href,
        isLoading: actions.loadingPlayId === `album-${album.id}`,
        onPlay: album.href
          ? (event: React.MouseEvent) => void actions.handlePlayAlbum(album.id, event)
          : undefined,
      })),
    [actions, albumsQuery.data],
  );
  const artists = useMemo<CollectionShelfItem[]>(
    () =>
      (artistsQuery.data?.artists ?? []).map((artist) => ({
        id: String(artist.id),
        title: artist.title,
        coverUrl: artist.coverUrl ?? "",
        href: artist.href,
        isArtist: true,
      })),
    [artistsQuery.data],
  );

  const isLoading = likedQuery.isLoading || playlistsQuery.isLoading || albumsQuery.isLoading;
  const isError = likedQuery.isError && playlistsQuery.isError && albumsQuery.isError;
  const isEmpty = !liked && playlists.length + albums.length + artists.length === 0;

  return (
    <>
      <header className="pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-content">
          {t("library.title.collection")}
        </h1>
      </header>
      {!isLoggedIn ? (
        <QuietState icon={Bookmark} title={t("library.loggedOut.collection")} />
      ) : (
        <LibraryContentState
          hasItems={!isEmpty}
          isError={isError}
          isLoading={isLoading}
          isRetrying={likedQuery.isRefetching}
          emptyState={
            <QuietState
              icon={Bookmark}
              title={t("library.empty.collection.title")}
              description={t("library.empty.collection.description")}
            />
          }
          onRetry={() => {
            void likedQuery.refetch();
            void playlistsQuery.refetch();
            void albumsQuery.refetch();
          }}
        >
          <div className="space-y-10">
            {liked && <LikedSongsHero liked={liked} />}
            <CollectionShelf title={t("library.collection.tab.playlists")} items={playlists} />
            <CollectionShelf title={t("library.collection.tab.albums")} items={albums} />
            <CollectionShelf title={t("library.collection.tab.artists")} items={artists} />
          </div>
        </LibraryContentState>
      )}
    </>
  );
}
