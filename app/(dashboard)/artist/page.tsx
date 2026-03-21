"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useCallback, useEffect, useState } from 'react';
import { Play, Pause, MoreHorizontal, BadgeCheck, Heart, Loader2 } from 'lucide-react';
import { getAritstDetail, getFansCnt, getArtistTopSongs, getArtistAlbums } from '@/lib/api/artist';
import { getAlbumDetail } from '@/lib/api/album';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { usePlayerStore } from '@/store';
import { pruneSongDetail, SongDetail } from '@/types/api/music';
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Track {
  id: string | number;
  title: string;
  durationMs: number;
  coverUrl: string;
  raw?: any;
}

export interface Album {
  id: string | number;
  title: string;
  releaseYear: number;
  type: string;
  coverUrl: string;
}

export interface ArtistInfo {
  id: string | number;
  name: string;
  isVerified: boolean;
  listeners: number;
  headerImageUrl: string;
  avatar: string;
  bio: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

const formatDuration = (ms: number) => {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ArtistPage() {
  const searchParams = useSearchParams();
  const artistId = searchParams.get('id');
  const router = useSmartRouter();

  const {
    currentSongDetail,
    isPlaying: storeIsPlaying,
    setIsPlaying,
    setQueue,
    playTrack,
    playQueueIndex,
  } = usePlayerStore();

  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [hotTracksQueue, setHotTracksQueue] = useState<SongDetail[]>([]);
  const [discography, setDiscography] = useState<Album[]>([]);
  const [hoveredTrack, setHoveredTrack] = useState<string | number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | number | null>(null);

  // 判断是否正在播放该歌手的歌曲队列
  const isPlayingArtist =
    hotTracksQueue.length > 0 &&
    currentSongDetail?.id === hotTracksQueue[0]?.id &&
    storeIsPlaying;

  // 判断单首曲目是否正在播放
  const isTrackPlaying = (id: string | number) =>
    currentSongDetail?.id === id && storeIsPlaying;

  // 播放/暂停歌手热门队列
  const handlePlayArtist = useCallback(() => {
    if (hotTracksQueue.length === 0) return;
    if (hotTracksQueue[0]?.id === currentSongDetail?.id) {
      setIsPlaying(!storeIsPlaying);
      return;
    }
    setQueue(hotTracksQueue, 0);
    playQueueIndex(0);
  }, [hotTracksQueue, currentSongDetail, storeIsPlaying, setIsPlaying, setQueue, playQueueIndex]);

  // 播放单首歌曲
  const handlePlayTrack = useCallback((track: Track, index: number) => {
    if (currentSongDetail?.id === track.id) {
      setIsPlaying(!storeIsPlaying);
      return;
    }
    if (hotTracksQueue.length > 0) {
      setQueue(hotTracksQueue, index);
    }

    // NOTE: 播放列表的对接位置
    playTrack(hotTracksQueue[index] || pruneSongDetail(track.raw));
  }, [currentSongDetail, storeIsPlaying, setIsPlaying, hotTracksQueue, setQueue, playTrack]);

  // 播放专辑
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

  useEffect(() => {
    if (!artistId) return;
    setIsLoading(true);

    Promise.allSettled([
      getAritstDetail(artistId),
      getFansCnt(artistId),
      getArtistTopSongs(artistId),
      getArtistAlbums(artistId, 10),
    ]).then(([infoRes, fansCntRes, tracksRes, albumsRes]) => {

      let fallbackCover = '';

      // 歌手基础信息
      if (infoRes.status === 'fulfilled') {
        const rawArtist = infoRes.value.data?.data?.artist || infoRes.value.data?.artist;
        const fansCnt = fansCntRes.status === 'fulfilled'
          ? (fansCntRes.value.data?.data?.fansCnt || 0)
          : 0;
        if (rawArtist) {
          fallbackCover = rawArtist.cover || rawArtist.picUrl || rawArtist.avatar || rawArtist.img1v1Url || '';

          setArtist({
            id: rawArtist.id,
            name: rawArtist.name,
            isVerified: true,
            listeners: fansCnt,
            headerImageUrl: rawArtist.cover || rawArtist.picUrl || '',
            avatar: rawArtist.avatar || rawArtist.img1v1Url || '',
            bio: rawArtist.briefDesc || "No biography available for this artist.",
          });
        }
      }

      // 热门歌曲
      if (tracksRes.status === 'fulfilled') {
        const rawSongs = tracksRes.value.data?.hotSongs || [];

        setPopularTracks(rawSongs.slice(0, 10).map((t: any) => ({
          id: t.id,
          title: t.name,
          durationMs: t.dt || t.duration || 0,
          coverUrl: t.al?.picUrl ? `${t.al.picUrl}?param=150y150` : fallbackCover,
          raw: t,
        })));

        // ! 构建 SongDetail 播放队列
        setHotTracksQueue(rawSongs.slice(0, 10).map((t: any) => {
          const songDetail = pruneSongDetail(t);
          if (!songDetail.al.picUrl) {
            songDetail.al.picUrl = fallbackCover;
          }
          return songDetail;
        }));
      }

      // 专辑列表
      if (albumsRes.status === 'fulfilled') {
        const rawAlbums = albumsRes.value.data?.hotAlbums || [];
        setDiscography(rawAlbums.slice(0, 10).map((a: any) => ({
          id: a.id,
          title: a.name,
          releaseYear: a.publishTime ? new Date(a.publishTime).getFullYear() : 0,
          type: a.type || 'Album',
          coverUrl: a.picUrl ? `${a.picUrl}?param=300y300` : '',
        })));
      }
    }).catch((err) => {
      console.error("Failed to fetch artist data:", err);
      toast.error("加载歌手数据失败");
    }).finally(() => {
      setIsLoading(false);
    });
  }, [artistId]);

  if (!artistId) return <div className="p-8 text-white h-screen bg-[#121212]">Invalid Artist ID</div>;
  if (isLoading || !artist) return (
    <div className="p-8 text-white h-screen bg-[#121212] flex justify-center items-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden pb-24">

      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] min-h-85 w-full flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${artist.headerImageUrl})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
        <div className="relative z-10 p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-2">
          {artist.isVerified && (
            <div className="flex items-center gap-2 text-sm md:text-base font-medium drop-shadow-md">
              <BadgeCheck className="w-5 h-5 text-[#1DB954]" fill="white" />
              <span>Verified Artist</span>
            </div>
          )}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 drop-shadow-xl">
            {artist.name}
          </h1>
          <p className="text-sm md:text-base text-gray-300 font-medium drop-shadow-md">
            {formatNumber(artist.listeners)} listeners
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto bg-linear-to-b from-black/20 to-[#121212]">

        {/* Action Bar */}
        <div className="p-6 md:p-8 flex items-center gap-6">
          <button
            onClick={handlePlayArtist}
            disabled={hotTracksQueue.length === 0}
            className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg shadow-black/40 disabled:opacity-50"
          >
            {isPlayingArtist ? (
              <Pause className="w-6 h-6 text-black fill-black" />
            ) : (
              <Play className="w-6 h-6 text-black fill-black ml-1" />
            )}
          </button>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-4 py-1.5 rounded-full border border-gray-400 text-sm font-bold uppercase tracking-widest hover:border-white hover:scale-105 transition-all ${isFollowing ? 'text-white border-white' : 'text-white'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-8 h-8" />
          </button>
        </div>

        {/* 内容网格：热门歌曲 + About */}
        <div className="px-6 md:px-8 flex flex-col xl:flex-row gap-12">

          {/* 热门歌曲 */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4">Popular</h2>
            {popularTracks.length > 0 ? (
              <div className="flex flex-col">
                {popularTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group flex items-center justify-between p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredTrack(track.id)}
                    onMouseLeave={() => setHoveredTrack(null)}
                    onClick={() => handlePlayTrack(track, index)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-6 text-right text-gray-400 text-sm tabular-nums relative flex items-center justify-center">
                        {hoveredTrack === track.id ? (
                          isTrackPlaying(track.id)
                            ? <Pause className="w-4 h-4 text-white fill-white" />
                            : <Play className="w-4 h-4 text-white fill-white" />
                        ) : isTrackPlaying(track.id) ? (
                          <span className="text-[#1DB954] font-bold">{index + 1}</span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      <img
                        src={track.coverUrl || artist.avatar || artist.headerImageUrl}
                        alt={track.title}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = artist.avatar || artist.headerImageUrl;
                        }}
                      />
                      <span className={`font-medium truncate max-w-50 md:max-w-xs ${isTrackPlaying(track.id) ? 'text-[#1DB954]' : 'text-white'}`}>
                        {track.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <button
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-right tabular-nums">
                        {formatDuration(track.durationMs)}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm py-4">暂无热门歌曲</div>
            )}
          </div>

          {/* About */}
          <div className="xl:w-80">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
              <div
                className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${artist.avatar})` }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                <p className="font-bold mb-2">{formatNumber(artist.listeners)} monthly listeners</p>
                <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{artist.bio}</p>
              </div>
            </div>
          </div>

        </div>

        {/* 专辑列表 */}
        <div className="px-6 md:px-8 mt-12 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Discography</h2>
          </div>

          {discography.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {discography.map((album) => (
                <div
                  key={album.id}
                  className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg cursor-pointer transition-colors group"
                  onClick={() => router.push(`/album?id=${album.id}`)}
                >
                  <div className="relative mb-4 pb-[100%]">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                    />
                    <button
                      onClick={(e) => handlePlayAlbum(album, e)}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105 hover:bg-[#1ed760]"
                    >
                      {loadingAlbumId === album.id ? (
                        <Loader2 className="w-5 h-5 text-black animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 text-black fill-black ml-1" />
                      )}
                    </button>
                  </div>
                  <h3 className="font-bold text-white truncate mb-1" title={album.title}>
                    {album.title}
                  </h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {album.releaseYear} • {album.type}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">暂无专辑数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
