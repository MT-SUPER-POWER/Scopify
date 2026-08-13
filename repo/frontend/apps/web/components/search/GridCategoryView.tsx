import { LoaderCircle } from "lucide-react";
import { AlbumCard } from "@/components/SearchContents/AlbumCard";
import { ArtistCard } from "@/components/SearchContents/ArtistCard";
import { PlaylistCard } from "@/components/SearchContents/PlaylistCard";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useI18n } from "@/store/module/i18n";
import type { GridCategoryViewProps } from "@/types/components/search";
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
  const { t } = useI18n();
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
              key={album.id}
              album={album}
              isPlaying={false}
              isLoading={loadingPlayId === `album-${album.id}`}
              onTogglePlay={(e) => onPlayAlbum(album, e)}
              onClick={() => onNavigate(`/album?id=${album.id}`)}
            />
          ))}
        {activeCategory === "Playlists" &&
          playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isPlaying={false}
              isLoading={loadingPlayId === `playlist-${playlist.id}`}
              onTogglePlay={(e) => onPlayPlaylist(playlist, e)}
              onClick={() => onNavigate(`/playlist?id=${playlist.id}`)}
            />
          ))}
        {activeCategory === "Artists" &&
          artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => onNavigate(`/artist?id=${artist.id}`)}
            />
          ))}
      </div>
      {isEmpty && <p className="text-content-subtle py-8 text-center text-sm">{emptyStateText}</p>}
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {isFetchingNextPage ? (
        <div className="text-content-muted flex justify-center py-6" aria-live="polite">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
