import { AlbumCard } from "@/components/search/AlbumCard";
import { ArtistCard } from "@/components/search/ArtistCard";
import { MvCard } from "@/components/mv/MvCard";
import { PlaylistCard } from "@/components/search/PlaylistCard";
import { SectionHeader } from "@/components/search/SectionHeader";
import { VoiceList } from "@/components/search/VoiceList";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useTranslation } from "react-i18next";

import type { AllViewProps } from "@/types/search/components";
import { BestMatchCard } from "./BestMatchCard";
import { PodcastCard } from "./PodcastCard";
import { SongsPanel } from "./SongsPanel";

export function AllView({
  songs,
  albums,
  playlists,
  artists,
  bestMatch,
  hasBestMatch,
  loadingPlayId,
  mvs,
  onPlayAlbum,
  onPlayPlaylist,
  onSeeAll,
  onNavigate,
  podcasts,
  voices,
}: AllViewProps) {
  const { t } = useTranslation();
  const canOpenArtist = useProviderCapability("artist.read");
  const canOpenAlbum = useProviderCapability("album.read");
  const canOpenPlaylist = useProviderCapability("playlist.read");

  return (
    <>
      {/* 顶部两栏：最佳匹配 + 歌曲；平台没有最佳匹配时歌曲占满整行 */}
      <div className="mb-10 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
        {hasBestMatch ? (
          <div className="flex min-w-0 xl:col-span-5">
            <BestMatchCard bestMatch={bestMatch} songs={songs} onNavigate={onNavigate} />
          </div>
        ) : null}
        <div
          className={
            hasBestMatch
              ? "flex min-w-0 flex-col xl:col-span-7"
              : "flex min-w-0 flex-col xl:col-span-12"
          }
        >
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
                key={artist.ref.id}
                artist={artist}
                onClick={
                  canOpenArtist ? () => onNavigate(`/artist?id=${artist.ref.id}`) : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* MV 网格 */}
      {mvs.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader title={t("search.section.mvs")} onSeeAll={() => onSeeAll("MVs")} />
          <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {mvs.slice(0, 3).map((mv) => (
              <MvCard key={mv.id} mv={mv} />
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
                key={album.ref.id}
                album={album}
                isPlaying={false}
                isLoading={loadingPlayId === `album-${album.ref.id}`}
                onTogglePlay={canOpenAlbum ? (e) => onPlayAlbum(album, e) : undefined}
                onClick={canOpenAlbum ? () => onNavigate(`/album?id=${album.ref.id}`) : undefined}
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
          </div>
        </div>
      )}

      {/* 声音列表 */}
      {voices.length > 0 && (
        <div className="mb-10 w-full min-w-0">
          <SectionHeader title={t("search.section.voices")} onSeeAll={() => onSeeAll("Voices")} />
          <VoiceList
            enableContextMenu
            voices={voices}
            limit={6}
            transcriptMode="popover"
            variant="preview"
          />
        </div>
      )}
    </>
  );
}
