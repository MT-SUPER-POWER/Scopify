import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getAlbumDetail } from "@/lib/providers/netease/api/album";
import { translate } from "@/lib/i18n";
import { usePlayerStore } from "@/store";
import { useI18nStore } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";
import type { Album, Track } from "@/types/artist/model";
import { adaptNeteaseTrack, getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";

export function useArtistPlay(hotTracksQueue: SongDetail[]) {
  const { currentTrack, isPlaying, setIsPlaying, setQueue, playTrack, playQueueIndex } =
    usePlayerStore();
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | number | null>(null);

  const isPlayingArtist =
    hotTracksQueue.length > 0 &&
    getNeteaseTrackId(currentTrack) === hotTracksQueue[0]?.id &&
    isPlaying;

  const isTrackPlaying = (id: string | number) =>
    getNeteaseTrackId(currentTrack) === id && isPlaying;

  const handlePlayArtist = useCallback(() => {
    if (hotTracksQueue.length === 0) return;
    if (hotTracksQueue[0]?.id === getNeteaseTrackId(currentTrack)) {
      setIsPlaying(!isPlaying);
      return;
    }
    setQueue(hotTracksQueue.map(adaptNeteaseTrack), 0);
    void playQueueIndex(0);
  }, [hotTracksQueue, currentTrack, isPlaying, setIsPlaying, setQueue, playQueueIndex]);

  const handlePlayTrack = useCallback(
    (track: Track, index: number) => {
      if (getNeteaseTrackId(currentTrack) === track.id) {
        setIsPlaying(!isPlaying);
        return;
      }
      if (hotTracksQueue.length > 0) setQueue(hotTracksQueue.map(adaptNeteaseTrack), index);
      const song = hotTracksQueue[index] ?? (track.raw ? pruneSongDetail(track.raw) : null);
      if (!song) return;
      void playTrack(adaptNeteaseTrack(song));
    },
    [currentTrack, isPlaying, setIsPlaying, hotTracksQueue, setQueue, playTrack],
  );

  const handlePlayAlbum = useCallback(
    async (album: Album, e: React.MouseEvent) => {
      e.stopPropagation();
      if (loadingAlbumId === album.id) return;
      setLoadingAlbumId(album.id);
      try {
        const res = await getAlbumDetail(album.id);
        const tracks: SongDetail[] = (res.data?.songs ?? []).map(pruneSongDetail);
        if (!tracks.length) {
          toast.error(translate(useI18nStore.getState().locale, "artist.toast.albumEmpty"));
          return;
        }
        setQueue(tracks.map(adaptNeteaseTrack), 0);
        await playQueueIndex(0);
      } catch {
        toast.error(translate(useI18nStore.getState().locale, "artist.toast.loadAlbumFailed"));
      } finally {
        setLoadingAlbumId(null);
      }
    },
    [loadingAlbumId, setQueue, playQueueIndex],
  );

  return {
    isPlayingArtist,
    isTrackPlaying,
    loadingAlbumId,
    handlePlayArtist,
    handlePlayTrack,
    handlePlayAlbum,
  };
}
