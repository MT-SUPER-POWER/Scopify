import { useCallback, useState } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/i18n";
import { getAlbumDetail } from "@/lib/api/album";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { usePlayerStore } from "@/store";
import { useI18nStore } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { Album, Playlist, Song } from "@/types/search";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album.picUrl || song.artists[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: { id: song.album.id, name: song.album.name, picUrl },
    publishTime: song.album.publishTime || 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function usePlayActions() {
  const { currentSongDetail, isPlaying, setIsPlaying, setQueue, playTrack, playQueueIndex } =
    usePlayerStore();
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);

  const isSongPlaying = (id: number) => currentSongDetail?.id === id && isPlaying;

  const handlePlaySong = useCallback(
    (song: Song, index: number, songList: Song[]) => {
      if (currentSongDetail?.id === song.id) {
        setIsPlaying(!isPlaying);
        return;
      }
      setQueue(songList.map(songToSongDetail), index);
      playTrack(songToSongDetail(song));
    },
    [currentSongDetail, isPlaying, setIsPlaying, setQueue, playTrack],
  );

  const handlePlayPlaylist = useCallback(
    async (playlist: Playlist, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `playlist-${playlist.id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const cookie =
          typeof window !== "undefined" ? localStorage.getItem("music_cookie") || "" : "";
        const res = await getPlaylistAllTracks({ id: playlist.id, cookie });
        const tracks: SongDetail[] = (res.data?.songs || []).map(pruneSongDetail);
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "sidebar.lib.noTracks"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "sidebar.lib.fetchTracksFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex],
  );

  const handlePlayAlbum = useCallback(
    async (album: Album, e: React.MouseEvent) => {
      e.stopPropagation();
      const key = `album-${album.id}`;
      if (loadingPlayId === key) return;
      setLoadingPlayId(key);
      try {
        const res = await getAlbumDetail(album.id);
        const tracks: SongDetail[] = (res.data?.songs || []).map((song: SongDetail) =>
          pruneSongDetail({
            ...song,
            al: {
              ...song.al,
              picUrl: song.al?.picUrl || res.data?.album?.picUrl || res.data?.album?.blurPicUrl,
            },
          }),
        );
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "artist.toast.albumEmpty"));
          return;
        }
        setQueue(tracks, 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "artist.toast.loadAlbumFailed"));
      } finally {
        setLoadingPlayId(null);
      }
    },
    [loadingPlayId, setQueue, playQueueIndex],
  );

  return { loadingPlayId, isSongPlaying, handlePlaySong, handlePlayPlaylist, handlePlayAlbum };
}
