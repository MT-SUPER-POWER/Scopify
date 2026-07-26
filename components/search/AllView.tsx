import { AlbumCard } from "@/components/SearchContents/AlbumCard";
import { ArtistCard } from "@/components/SearchContents/ArtistCard";
import { PlaylistCard } from "@/components/SearchContents/PlaylistCard";
import { SectionHeader } from "@/components/SearchContents/SectionHeader";
import { useI18n } from "@/store/module/i18n";
import type { AllViewProps } from "@/types/components/search";
import { BestMatchCard } from "./BestMatchCard";
import { PodcastCard } from "./PodcastCard";
import { SongsPanel } from "./SongsPanel";
import { VoiceList } from "./VoiceList";

export function AllView({
  songs,
  albums,
  playlists,
  artists,
  bestMatch,
  loadingPlayId,
  onPlayAlbum,
  onPlayPlaylist,
  onSeeAll,
  onNavigate,
  podcasts,
  voices,
}: AllViewProps) {
  const { t } = useI18n();
  return (
    <>
      {/* 顶部两栏：最佳匹配 + 歌曲 */}
      <div className="mb-10 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex min-w-0 xl:col-span-5">
          <BestMatchCard bestMatch={bestMatch} songs={songs} onNavigate={onNavigate} />
        </div>
        <div className="flex min-w-0 flex-col xl:col-span-7">
          <SongsPanel songs={songs} limit={4} onViewAll={() => onSeeAll("Songs")} />
        </div>
      </div>

      {/* 歌手网格 */}
      {artists.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader title={t("search.section.artists")} onSeeAll={() => onSeeAll("Artists")} />
          <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
            {artists.slice(0, 6).map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => onNavigate(`/artist?id=${artist.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 播客网格 */}
      {podcasts.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader
            title={t("search.section.podcasts")}
            onSeeAll={() => onSeeAll("Podcasts")}
          />
          <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
            {podcasts.slice(0, 6).map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </div>
      )}

      {/* 专辑网格 */}
      {albums.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader title={t("search.section.albums")} onSeeAll={() => onSeeAll("Albums")} />
          <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
            {albums.slice(0, 6).map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                isPlaying={false}
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
        <div className="mb-10 w-full min-w-0">
          <SectionHeader
            title={t("search.section.playlists")}
            onSeeAll={() => onSeeAll("Playlists")}
          />
          <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
            {playlists.slice(0, 6).map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                isPlaying={false}
                isLoading={loadingPlayId === `playlist-${playlist.id}`}
                onTogglePlay={(e) => onPlayPlaylist(playlist, e)}
                onClick={() => onNavigate(`/playlist?id=${playlist.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 声音列表 */}
      {voices.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader title={t("search.section.voices")} onSeeAll={() => onSeeAll("Voices")} />
          <VoiceList voices={voices} limit={6} variant="preview" />
        </div>
      )}
    </>
  );
}
