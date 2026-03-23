import { useState, useCallback } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/store";
import { pruneSongDetail, SongDetail } from "@/types/api/music";
import { getAlbumDetail } from "@/lib/api/album";
import { Track, Album } from "../_types";

export function useArtistPlay(hotTracksQueue: SongDetail[]) {
  const { currentSongDetail, isPlaying, setIsPlaying, setQueue, playTrack, playQueueIndex } = usePlayerStore();
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | number | null>(null);

  const isPlayingArtist =
    hotTracksQueue.length > 0 &&
    currentSongDetail?.id === hotTracksQueue[0]?.id &&
    isPlaying;

  const isTrackPlaying = (id: string | number) =>
    currentSongDetail?.id === id && isPlaying;

  const handlePlayArtist = useCallback(() => {
    if (hotTracksQueue.length === 0) return;
    if (hotTracksQueue[0]?.id === currentSongDetail?.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    setQueue(hotTracksQueue, 0);
    playQueueIndex(0);
  }, [hotTracksQueue, currentSongDetail, isPlaying, setIsPlaying, setQueue, playQueueIndex]);

  const handlePlayTrack = useCallback((track: Track, index: number) => {
    if (currentSongDetail?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (hotTracksQueue.length > 0) setQueue(hotTracksQueue, index);
    playTrack(hotTracksQueue[index] || pruneSongDetail(track.raw));
  }, [currentSongDetail, isPlaying, setIsPlaying, hotTracksQueue, setQueue, playTrack]);

  const handlePlayAlbum = useCallback(async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingAlbumId === album.id) return;
    setLoadingAlbumId(album.id);
    try {
      const res = await getAlbumDetail(album.id);
      const tracks: SongDetail[] = (res.data?.songs || []).map(pruneSongDetail);
      if (!tracks.length) { toast.error("专辑为空"); return; }
      setQueue(tracks, 0);
      await playQueueIndex(0);
    } catch {
      toast.error("加载专辑失败");
    } finally {
      setLoadingAlbumId(null);
    }
  }, [loadingAlbumId, setQueue, playQueueIndex]);

  return { isPlayingArtist, isTrackPlaying, loadingAlbumId, handlePlayArtist, handlePlayTrack, handlePlayAlbum };
}
