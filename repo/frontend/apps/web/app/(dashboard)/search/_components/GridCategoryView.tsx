import { LoaderCircle } from "lucide-react";
import { AlbumCard } from "@/components/search/AlbumCard";
import { ArtistCard } from "@/components/search/ArtistCard";
import { PlaylistCard } from "@/components/search/PlaylistCard";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useTranslation } from "react-i18next";

import type { GridCategoryViewProps } from "@/types/search/components";
import { SearchCategoryHeader } from "./SearchCategoryHeader";

export function GridCategoryView({
  activeCategory,
  albums,
  playlists,
  artists,
  loadingPlayId,
  onPlayAlbum,
  onPlayPlaylist,
  onNavigate,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: GridCategoryViewProps) {
  const { t } = useTranslation();
  const canOpenArtist = useProviderCapability("artist.read");
  const canOpenAlbum = useProviderCapability("album.read");
  const canOpenPlaylist = useProviderCapability("playlist.read");
  const isEmpty =
    (activeCategory === "Albums" && albums.length === 0) ||
    (activeCategory === "Playlists" && playlists.length === 0) ||
    (activeCategory === "Artists" && artists.length === 0);
  const loadMoreRef = useInfiniteScrollTrigger({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: onLoadMore,
  });

  const emptyStateText =
    activeCategory === "Albums"
      ? t("search.section.noAlbumResults")
      : activeCategory === "Playlists"
        ? t("search.section.noPlaylistResults")
        : t("search.section.noArtistResults");

  return (
    <div className="pb-10">
      <SearchCategoryHeader category={activeCategory} />
      <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
        {activeCategory === "Albums" &&
          albums.map((album) => (
            <AlbumCard
              key={album.ref.id}
              album={album}
              isPlaying={false}
              isLoading={loadingPlayId === `album-${album.ref.id}`}
              onTogglePlay={canOpenAlbum ? (e) => onPlayAlbum(album, e) : undefined}
              onClick={canOpenAlbum ? () => onNavigate(`/album?id=${album.ref.id}`) : undefined}
            />
          ))}
        {activeCategory === "Playlists" &&
          playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.ref.id}
              playlist={playlist}
              isPlaying={false}
              isLoading={loadingPlayId === `playlist-${playlist.ref.id}`}
              onTogglePlay={(e) => onPlayPlaylist(playlist, e)}
              onClick={
                canOpenPlaylist ? () => onNavigate(`/playlist?id=${playlist.ref.id}`) : undefined
              }
            />
          ))}
        {activeCategory === "Artists" &&
          artists.map((artist) => (
            <ArtistCard
              key={artist.ref.id}
              artist={artist}
              onClick={canOpenArtist ? () => onNavigate(`/artist?id=${artist.ref.id}`) : undefined}
            />
          ))}
      </div>
      {isEmpty && <p className="py-8 text-center text-sm text-content-subtle">{emptyStateText}</p>}
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="flex justify-center py-6 text-content-muted" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
