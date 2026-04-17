import { AlbumCard } from "@/components/SearchContents/AlbumCard";
import { ArtistCard } from "@/components/SearchContents/ArtistCard";
import { PlaylistCard } from "@/components/SearchContents/PlaylistCard";
import type { Album, Artist, Playlist } from "@/types/search";

type GridCategory = "Albums" | "Playlists" | "Artists";

interface Props {
  activeCategory: GridCategory;
  albums: Album[];
  playlists: Playlist[];
  artists: Artist[];
  loadingPlayId: string | null;
  onPlayAlbum: (album: Album, e: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: Playlist, e: React.MouseEvent) => void;
  onNavigate: (path: string) => void;
}

export function GridCategoryView({
  activeCategory,
  albums,
  playlists,
  artists,
  loadingPlayId,
  onPlayAlbum,
  onPlayPlaylist,
  onNavigate,
}: Props) {
  const isEmpty =
    (activeCategory === "Albums" && albums.length === 0) ||
    (activeCategory === "Playlists" && playlists.length === 0) ||
    (activeCategory === "Artists" && artists.length === 0);

  return (
    <div className="pb-10">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">Search {activeCategory}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
      {isEmpty && (
        <p className="text-zinc-500 text-sm py-8 text-center">No {activeCategory} results found</p>
      )}
    </div>
  );
}
