import { ArtistCard } from "@/components/SearchContents/ArtistCard";
import { AlbumCard } from "@/components/SearchContents/AlbumCard";
import { PlaylistCard } from "@/components/SearchContents/PlaylistCard";
import { SectionHeader } from "@/components/SearchContents/SectionHeader";
import { Song, Album, Playlist, Artist, Category } from "../_types";
import { BestMatchCard } from "./BestMatchCard";
import { SongsPanel } from './Songspanel';


interface Props {
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  artists: Artist[];
  loadingPlayId: string | null;
  onPlayAlbum: (album: Album, e: React.MouseEvent) => void;
  onPlayPlaylist: (playlist: Playlist, e: React.MouseEvent) => void;
  onSeeAll: (cat: Category) => void;
  onNavigate: (path: string) => void;
}

export function AllView({
  songs, albums, playlists, artists,
  loadingPlayId,
  onPlayAlbum, onPlayPlaylist,
  onSeeAll, onNavigate,
}: Props) {
  const topSong = songs[0] ?? null;

  return (
    <>
      {/* 顶部两栏：最佳匹配 + 歌曲 */}
      <div className="flex flex-col xl:flex-row gap-6 mb-10">
        <BestMatchCard song={topSong} songs={songs} />
        <SongsPanel
          songs={songs}
          limit={4}
          onViewAll={() => onSeeAll("Songs")}
        />
      </div>

      {/* 歌手网格 */}
      {artists.length > 0 && (
        <div className="mb-10">
          <SectionHeader title="Artists" onSeeAll={() => onSeeAll("Artists")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artists.slice(0, 6).map((artist) => (
              <ArtistCard key={artist.id} artist={artist} onClick={() => onNavigate(`/artist?id=${artist.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* 专辑网格 */}
      {albums.length > 0 && (
        <div className="mb-10">
          <SectionHeader title="Albums" onSeeAll={() => onSeeAll("Albums")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.slice(0, 6).map((album) => (
              <AlbumCard
                key={album.id} album={album} isPlaying={false}
                isLoading={loadingPlayId === `album-${album.id}`}
                onTogglePlay={(e) => onPlayAlbum(album, e)}
                onClick={() => onNavigate(`/album?id=${album.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 歌单网格 */}
      {playlists.length > 0 && (
        <div className="mb-10">
          <SectionHeader title="Playlists" onSeeAll={() => onSeeAll("Playlists")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist.id} playlist={playlist} isPlaying={false}
                isLoading={loadingPlayId === `playlist-${playlist.id}`}
                onTogglePlay={(e) => onPlayPlaylist(playlist, e)}
                onClick={() => onNavigate(`/playlist?id=${playlist.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
