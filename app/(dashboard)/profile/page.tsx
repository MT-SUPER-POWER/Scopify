"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, MoreHorizontal, Loader2, Clock, Heart } from 'lucide-react';
import { useUserStore } from '@/store/module/user';
import { usePlayerStore } from '@/store';
import { TbSettings } from "react-icons/tb";
import { getRecentSongs, getRecentPlaylists } from '@/lib/api/user';
import { pruneSongDetail, SongDetail } from '@/types/api/music';
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { getMainColorFromImage } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn, formatDuration } from '@/lib/utils';

export default function ProfilePage() {
  const router = useSmartRouter();
  const user = useUserStore((state) => state.user);

  const { setQueue, playTrack, currentSongDetail, isPlaying } = usePlayerStore();

  const [recentSongs, setRecentSongs] = useState<SongDetail[]>([]);
  const [recentPlaylists, setRecentPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);

  // 与 playlist page 完全一致：从头像提取主色做渐变背景
  const [themeColor, setThemeColor] = useState<string>("#535353");

  useEffect(() => {
    if (user?.avatarUrl) {
      getMainColorFromImage(user.avatarUrl)
        .then((color) => { if (color) setThemeColor(color); })
        .catch(() => { });
    }
  }, [user?.avatarUrl]);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      getRecentSongs(10),
      getRecentPlaylists(10)
    ]).then(([songsRes, playlistsRes]) => {
      if (songsRes.status === 'fulfilled') {
        const rawSongs = songsRes.value.data?.data?.list || [];
        setRecentSongs(rawSongs.slice(0, 10).map((item: any) => pruneSongDetail(item.data)));
      } else {
        toast.error("加载最近播放歌曲失败");
      }

      if (playlistsRes.status === 'fulfilled') {
        const rawPlaylists = playlistsRes.value.data?.data?.list || [];
        setRecentPlaylists(rawPlaylists.slice(0, 10).map((item: any) => item.data));
      } else {
        toast.error("加载最近播放歌单失败");
      }
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const handlePlaySong = (index: number) => {
    if (recentSongs.length === 0) return;
    const song = recentSongs[index];
    if (currentSongDetail?.id === song.id) {
      usePlayerStore.getState().setIsPlaying(!isPlaying);
      return;
    }
    setQueue(recentSongs, index);
    playTrack(song);
  };

  const isTrackPlaying = (id: number) => currentSongDetail?.id === id;

  if (isLoading) {
    return (
      <div className="h-full bg-[#121212] flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-[#121212] font-sans text-white pb-24">

      {/* 顶部背景渐变 — 与 playlist page 完全相同的写法 */}
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60"
        style={{ background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)` }}
      />

      {/* Hero Header — 对齐 playlist page 的 flex-col md:flex-row + pt-24 pb-6 px-6 */}
      <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 px-6 pt-24 pb-6">

        {/* 左侧：头像，尺寸 / 阴影 / hover 与封面保持一致，仅保留圆形作为 profile 区分 */}
        <div className="w-48 h-48 lg:w-56 lg:h-56 shrink-0 transition-transform duration-300 hover:scale-[1.02]
            shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-full overflow-hidden bg-black/20">
          <img
            src={user?.avatarUrl || "https://picsum.photos/seed/profile/400/400"}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 右侧：信息区，结构与 playlist page 右侧完全一致 */}
        <div className="flex flex-col flex-1 min-w-0 text-white pt-1 md:pt-2">

          {/* 1. 标签区 */}
          <div className="flex flex-row gap-2 flex-wrap items-center mb-3 md:mb-4">
            <span className="text-sm drop-shadow-md uppercase tracking-wider bg-white/10 px-3 py-1 rounded-sm">
              Profile
            </span>
          </div>

          {/* 2. 标题区 */}
          <h1
            className="m-0 font-black tracking-tighter leading-[1.1] drop-shadow-lg mb-4 md:mb-6
            wrap-break-word text-4xl md:text-5xl lg:text-6xl line-clamp-3"
            title={user?.nickname}
          >
            {user?.nickname || "Your Name"}
          </h1>

          {/* 3. 元数据区 */}
          <div className="flex flex-wrap items-center gap-2.5 text-sm text-white/80 drop-shadow-md">
            <span>
              <span className="text-white font-semibold">{user?.followeds?.toLocaleString() ?? 0}</span>
              {' '}Followers
            </span>
            <span className="opacity-60">•</span>
            <span>
              <span className="text-white font-semibold">{user?.follows?.toLocaleString() ?? 0}</span>
              {' '}Following
            </span>
            {recentPlaylists.length > 0 && (
              <>
                <span className="opacity-60">•</span>
                <span className="font-medium text-white"> {recentPlaylists.length} Recent Playlists</span>
              </>
            )}
          </div>

        </div>
      </div>

      {/* 过渡遮罩 + 内容区 — 与 playlist page 完全一致 */}
      <div className="flex-1 relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">

        {/* Action Bar */}
        <div className="flex items-center px-6 py-6 gap-6">
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-white transition-colors">
                <TbSettings className="w-8 h-8" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-[#282828] border-none text-white p-2">
              <div className="flex flex-col text-sm font-medium">
                <button className="text-left px-3 py-2 hover:bg-white/10 rounded-sm">Edit Profile</button>
                <button className="text-left px-3 py-2 hover:bg-white/10 rounded-sm">Copy Link</button>
              </div>
            </PopoverContent>
          </Popover>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-8 h-8" />
          </button>
        </div>

        {/* 最近播放 - 歌曲 */}
        <div className="px-6 mt-4">
          <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Recent Songs</h2>
          {recentSongs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10 hover:bg-transparent text-gray-400 text-sm h-10">
                  <TableHead className="w-12 text-center font-normal">#</TableHead>
                  <TableHead className="font-normal">Title</TableHead>
                  <TableHead className="hidden md:table-cell font-normal">Album</TableHead>
                  <TableHead className="text-right pr-8 font-normal">
                    <Clock className="w-4 h-4 inline-block" />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentSongs.map((song, index) => (
                  <TableRow
                    key={`${song.id}-${index}`}
                    className="group cursor-pointer hover:bg-white/10 border-none transition-colors h-14"
                    onMouseEnter={() => setHoveredTrackIndex(index)}
                    onMouseLeave={() => setHoveredTrackIndex(null)}
                    onDoubleClick={() => handlePlaySong(index)}
                  >
                    <TableCell className="w-12 text-center rounded-l-md text-gray-400">
                      {hoveredTrackIndex === index ? (
                        <button
                          onClick={() => handlePlaySong(index)}
                          className="flex items-center justify-center w-full h-full text-white"
                        >
                          {isTrackPlaying(song.id)
                            ? <Pause className="w-4 h-4 fill-white" />
                            : <Play className="w-4 h-4 fill-white" />}
                        </button>
                      ) : isTrackPlaying(song.id) ? (
                        <span className="text-[#1DB954] font-bold mx-auto flex items-center justify-center">
                          {isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3 shrink-0 group-hover:hidden">
                              {[0, 0.2, 0.4].map((delay, i) => (
                                <motion.div
                                  key={i}
                                  className="w-0.5 bg-[#1ed760] rounded-full"
                                  animate={{ scaleY: [0.4, 1, 0.4] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
                                  style={{ height: "100%", originY: 1 }}
                                />
                              ))}
                            </div>
                          ) : (
                            <Play className="w-4 h-4 fill-[#1DB954]" />
                          )}
                        </span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={song.al.picUrl ? `${song.al.picUrl}?param=50y50` : user?.avatarUrl}
                          alt={song.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex flex-col justify-center max-w-50 sm:max-w-xs md:max-w-md">
                          <span className={cn(`truncate text-base ${isTrackPlaying(song.id) && 'text-[#1DB954]'}`)}>
                            {song.name}
                          </span>
                          <span className="truncate text-sm text-gray-400 hover:underline">
                            {song.ar.map(a => a.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-400 text-sm hover:underline truncate max-w-37.5">
                      {song.al.name}
                    </TableCell>
                    <TableCell className="text-right text-gray-400 rounded-r-md pr-8 tabular-nums text-sm">
                      <div className="flex items-center justify-end gap-4">
                        <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                          <Heart className="w-4 h-4" />
                        </button>
                        <span>{formatDuration(song.dt)}</span>
                        <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-gray-400 text-sm py-4">No playback history available</div>
          )}
        </div>

        {/* 最近播放 - 歌单 */}
        <div className="px-6 mt-10 mb-20">
          <h2 className="text-2xl font-bold mb-6 hover:underline cursor-pointer">Recent Playlists</h2>
          {recentPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recentPlaylists.map((playlist, index) => (
                <div
                  key={`${playlist.id}-${index}`}
                  className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer"
                  onClick={() => router.push(`/playlist?id=${playlist.id}`)}
                >
                  <div className="relative w-full aspect-square mb-4 shadow-lg rounded-md overflow-hidden">
                    <img
                      src={playlist.coverImgUrl ? `${playlist.coverImgUrl}?param=300y300` : ''}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        className="w-12 h-12 bg-[#1ed760] rounded-full flex items-center justify-center shadow-xl hover:scale-105 hover:bg-[#1fdf64]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/playlist?id=${playlist.id}`);
                        }}
                      >
                        <Play size={24} fill="black" stroke="black" className="ml-1" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-white truncate mb-1" title={playlist.name}>
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {playlist.creator?.nickname || '未知'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂无歌单记录</div>
          )}
        </div>

      </div>
    </div>
  );
}
