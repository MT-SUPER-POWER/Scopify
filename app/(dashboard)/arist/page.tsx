"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useEffect, useState } from 'react';
import { Play, Pause, MoreHorizontal, BadgeCheck, Heart } from 'lucide-react';
import { getAritstDetail, getFansCnt } from '@/lib/api/arist';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const getArtistTopTracks = async (id: string) => ({ data: { songs: [] } });
const getArtistAlbums = async (id: string) => ({ data: { hotAlbums: [] } });


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Track {
  id: string | number;
  title: string;
  playCount: number;
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

export interface Artist {
  id: string | number;
  name: string;
  isVerified: boolean;
  Listeners: number;        // 粉丝数
  headerImageUrl: string;   // 顶部大图背景
  avatar: string;           // 关于模块的小头像
  bio: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDuration = (ms: number) => {
  if (!ms) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ArtistPage() {
  const searchParams = useSearchParams();
  const artistId = searchParams.get('id');

  // UI 核心状态
  const [artist, setArtist] = useState<Artist | null>(null);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [discography, setDiscography] = useState<Album[]>([]);

  // 交互控制状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 核心数据获取逻辑
  useEffect(() => {
    if (!artistId) return;

    setIsLoading(true);

    // 【工程化实践：Promise.all 并发请求】
    // 避免 Waterfall (瀑布式) 请求阻塞。
    // 即：不要等 Detail 请求完再去请求 Tracks，而是同时发出，同时等待。
    Promise.all([
      getAritstDetail(artistId),
      getFansCnt(artistId),
      // TODO: 放开下方注释，并接入真实的 API 方法
      getArtistTopTracks(artistId).catch(() => ({ data: { songs: [] } })),
      getArtistAlbums(artistId).catch(() => ({ data: { hotAlbums: [] } })),
    ])
      .then(([infoRes, fansCntRes, tracksRes, albumsRes]) => {
        // 1. 解析歌手基础数据 (根据你提供的林俊杰 API 结构)
        // 注意兼容 axios 的多层 data 包装
        const rawArtist = infoRes.data?.data?.artist || infoRes.data?.artist;
        console.log("fansCntRes", fansCntRes);
        const fansCnt = fansCntRes.data?.data?.fansCnt || 0;

        if (rawArtist) {
          setArtist({
            id: rawArtist.id,
            name: rawArtist.name,
            isVerified: true,
            // TODO: 粉丝数量补充
            Listeners: fansCnt || 0,
            headerImageUrl: rawArtist.cover || rawArtist.picUrl || '',
            avatar: rawArtist.avatar || rawArtist.img1v1Url || '',
            bio: rawArtist.briefDesc || "No biography available for this artist."
          });
        }

        // 2. 解析热门歌曲 (预留适配器)
        const rawTracks = tracksRes?.data?.songs || [];
        setPopularTracks(rawTracks.slice(0, 5).map((t: any) => ({
          id: t.id,
          title: t.name,
          playCount: 0, // 如果没有单独的播放量，可以设为默认或隐藏
          durationMs: t.dt || t.duration,
          coverUrl: t.al?.picUrl ? `${t.al.picUrl}?param=150y150` : '',
          raw: t
        })));

        // 3. 解析专辑列表 (预留适配器)
        const rawAlbums = albumsRes?.data?.hotAlbums || [];
        setDiscography(rawAlbums.slice(0, 5).map((a: any) => ({
          id: a.id,
          title: a.name,
          releaseYear: new Date(a.publishTime).getFullYear(),
          type: a.type || 'Album',
          coverUrl: a.picUrl ? `${a.picUrl}?param=300y300` : ''
        })));

      })
      .catch((err) => {
        console.error("Failed to fetch artist data:", err);
        toast.error("加载歌手数据失败");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [artistId]);

  if (!artistId) return <div className="p-8 text-white h-screen bg-[#121212]">Invalid Artist ID</div>;
  if (isLoading || !artist) return <div className="p-8 text-white h-screen bg-[#121212] flex justify-center items-center">Loading Artist Data...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden pb-24">

      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] min-h-85 w-full flex items-end">
        {/* 背景图与遮罩 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          // 这里使用了你 JSON 数据里的 `cover` (也就是映射后的 headerImageUrl)
          style={{ backgroundImage: `url(${artist.headerImageUrl})` }}
        />
        {/* 使用深色遮罩保证白色文字的可读性 */}
        <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />

        {/* 歌手信息 */}
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
            {formatNumber(artist.Listeners)} listeners
          </p>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto bg-linear-to-b from-black/20 to-[#121212]">

        {/* Action Bar (播放、关注等按钮) */}
        <div className="p-6 md:p-8 flex items-center gap-6">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center hover:scale-105 hover:bg-[#1ed760] transition-all shadow-lg shadow-black/40"
          >
            {isPlaying ? (
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

        {/* 内容网格布局：左侧热门歌曲，右侧 About */}
        <div className="px-6 md:px-8 flex flex-col xl:flex-row gap-12">

          {/* 热门歌曲 (Popular Tracks) */}
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
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* 序号或播放按钮 */}
                      <div className="w-6 text-right text-gray-400 text-sm md:text-base font-variant-numeric tabular-nums relative">
                        {hoveredTrack === track.id ? (
                          <Play className="w-4 h-4 text-white fill-white absolute right-0 top-1/2 -translate-y-1/2" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      {/* 封面与标题 */}
                      {track.coverUrl && <img src={track.coverUrl} alt={track.title} className="w-10 h-10 object-cover rounded" />}
                      <span className="font-medium text-white truncate max-w-50 md:max-w-xs">
                        {track.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                      <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                        <Heart className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-right font-variant-numeric tabular-nums">
                        {formatDuration(track.durationMs)}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm py-4">
                (热门歌曲请求已预留，接入真实 API 后此处将展示列表)
              </div>
            )}
          </div>

          {/* About (关于歌手) */}
          <div className="xl:w-80">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
              <div
                className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                // 这里使用了你 JSON 数据里的 `avatar` 作为展示图
                style={{ backgroundImage: `url(${artist.avatar})` }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                <p className="font-bold mb-2">{formatNumber(artist.Listeners)} monthly listeners</p>
                {/* 使用你数据里的 briefDesc，line-clamp-3 可以多行截断 */}
                <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{artist.bio}</p>
              </div>
            </div>
          </div>

        </div>

        {/* 专辑列表 (Discography) */}
        <div className="px-6 md:px-8 mt-12 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold hover:underline cursor-pointer">Discography</h2>
            <span className="text-sm font-bold text-gray-400 hover:text-white uppercase cursor-pointer">Show all</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {discography.length > 0 ? discography.map((album) => (
              <div key={album.id} className="bg-[#181818] hover:bg-[#282828] p-4 rounded-lg cursor-pointer transition-colors group">
                <div className="relative mb-4 pb-[100%]">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                  />
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-black/40 hover:scale-105 hover:bg-[#1ed760]">
                    <Play className="w-5 h-5 text-black fill-black ml-1" />
                  </button>
                </div>
                <h3 className="font-bold text-white truncate mb-1" title={album.title}>
                  {album.title}
                </h3>
                <p className="text-sm text-gray-400 capitalize">
                  {album.releaseYear} • {album.type}
                </p>
              </div>
            )) : (
              <div className="text-zinc-500 text-sm col-span-full">
                (专辑数据请求已预留，接入真实 API 后此处将展示列表)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
