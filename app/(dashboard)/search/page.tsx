"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  searchSongs,
  searchPlaylists,
  searchAlbums,
  searchArtists
} from "@/lib/api/search";
import { getPlaylistAllTracks } from "@/lib/api/playlist";
import { getAlbumDetail } from "@/lib/api/album";
import { pruneSongDetail, SongDetail } from "@/types/api/music";
import { usePlayerStore } from "@/store";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";

import { SongRow } from "@/components/SearchContents/SongRow";
import { ArtistCard } from "@/components/SearchContents/ArtistCard";
import { AlbumCard } from "@/components/SearchContents/AlbumCard";
import { PlaylistCard } from "@/components/SearchContents/PlaylistCard";
import { SectionHeader } from "@/components/SearchContents/SectionHeader";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ TYPES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Artist {
  id: number;
  name: string;
  picUrl: string | null;
  img1v1Url?: string;
  alias?: string[];
  albumSize?: number;
  musicSize?: number;
  fansSize?: number | null;
}

export interface Album {
  id: number;
  name: string;
  artist: Artist;
  publishTime: number;
  size: number;
  picUrl?: string;
  blurPicUrl?: string;
}

export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number;
  mvid?: number;
  fee?: number;
  alias?: string[];
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator?: { nickname: string };
  trackCount: number;
  playCount: number;
  bookCount?: number;
  description?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 判断是否是合法的图片 URL（非数字 ID） */
function isValidPicUrl(url: any): url is string {
  return typeof url === "string" && url.startsWith("http");
}

function mapResourceToSong(resource: any): Song {
  const s = resource?.baseInfo?.simpleSongData || {};
  const albumPicUrl = isValidPicUrl(s.al?.picUrl)
    ? s.al.picUrl
    : isValidPicUrl(s.al?.blurPicUrl)
      ? s.al.blurPicUrl
      : null;
  const artistPicUrl = s.ar?.[0]?.picUrl && isValidPicUrl(s.ar[0].picUrl)
    ? s.ar[0].picUrl
    : null;

  return {
    id: s.id,
    name: s.name || "Unknown Song",
    artists: s.ar?.map((a: any) => ({ id: a.id, name: a.name, picUrl: isValidPicUrl(a.picUrl) ? a.picUrl : null })) || [],
    album: {
      id: s.al?.id || 0,
      name: s.al?.name || "Unknown Album",
      artist: s.ar?.[0] || ({} as Artist),
      publishTime: s.publishTime || 0,
      size: 0,
      picUrl: albumPicUrl || artistPicUrl || "",
    },
    duration: s.dt || 0,
    fee: s.fee,
    alias: s.alia || s.alias || [],
  };
}

function songToSongDetail(song: Song): SongDetail {
  // album picUrl 优先，fallback 到第一个歌手的头像
  const picUrl = song.album.picUrl || song.artists[0]?.picUrl || "";
  return {
    id: song.id,
    name: song.name,
    dt: song.duration,
    ar: song.artists.map((a) => ({ id: a.id, name: a.name })),
    al: {
      id: song.album.id,
      name: song.album.name,
      picUrl,
    },
    publishTime: song.album.publishTime || 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORIES = ["All", "Songs", "Artists", "Playlists", "Albums"] as const;
type Category = (typeof CATEGORIES)[number];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PAGE COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const keywords = searchParams.get("keywords") || "";
  const router = useSmartRouter();

  const {
    currentSongDetail,
    isPlaying: storeIsPlaying,
    setIsPlaying,
    setQueue,
    playTrack,
    playQueueIndex,
  } = usePlayerStore();

  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(false);
  const [loadingPlayId, setLoadingPlayId] = useState<string | null>(null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  // ── 判断播放状态 ──
  const isSongPlaying = (id: number) => currentSongDetail?.id === id && storeIsPlaying;

  // ── 播放歌曲 ──
  const handlePlaySong = useCallback((song: Song, index: number, songList: Song[]) => {
    if (currentSongDetail?.id === song.id) {
      setIsPlaying(!storeIsPlaying);
      return;
    }
    const queue = songList.map(songToSongDetail);
    setQueue(queue, index);
    playTrack(songToSongDetail(song));
  }, [currentSongDetail, storeIsPlaying, setIsPlaying, setQueue, playTrack]);

  // ── 播放歌单 ──
  const handlePlayPlaylist = useCallback(async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `playlist-${playlist.id}`;
    if (loadingPlayId === key) return;
    setLoadingPlayId(key);
    try {
      const cookie = typeof window !== "undefined" ? localStorage.getItem("music_cookie") || "" : "";
      const res = await getPlaylistAllTracks({ id: playlist.id, cookie });
      const tracks: SongDetail[] = (res.data?.songs || []).map(pruneSongDetail);
      if (!tracks.length) { toast.error("Playlist is empty"); return; }
      setQueue(tracks, 0);
      await playQueueIndex(0);
    } catch {
      toast.error("Failed to load playlist");
    } finally {
      setLoadingPlayId(null);
    }
  }, [loadingPlayId, setQueue, playQueueIndex]);

  // ── 播放专辑 ──
  const handlePlayAlbum = useCallback(async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `album-${album.id}`;
    if (loadingPlayId === key) return;
    setLoadingPlayId(key);
    try {
      const res = await getAlbumDetail(album.id);
      const tracks: SongDetail[] = (res.data?.songs || []).map(pruneSongDetail);
      if (!tracks.length) { toast.error("Album is empty"); return; }
      setQueue(tracks, 0);
      await playQueueIndex(0);
    } catch {
      toast.error("Failed to load album");
    } finally {
      setLoadingPlayId(null);
    }
  }, [loadingPlayId, setQueue, playQueueIndex]);

  // ── 并发请求所有首屏数据 ──
  const fetchAllData = useCallback(async () => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      const [songsRes, albumsRes, playlistsRes, artistsRes] = await Promise.allSettled([
        searchSongs(keywords, 4),
        searchAlbums(keywords, 6),
        searchPlaylists(keywords, 6),
        searchArtists(keywords, 6)
      ]);

      if (songsRes.status === "fulfilled" && songsRes.value.data?.data?.resources) {
        setSongs(songsRes.value.data.data.resources.map(mapResourceToSong));
      } else { setSongs([]); }

      if (albumsRes.status === "fulfilled" && albumsRes.value.data?.result?.albums) {
        setAlbums(albumsRes.value.data.result.albums);
      } else { setAlbums([]); }

      if (playlistsRes.status === "fulfilled" && playlistsRes.value.data?.result?.playlists) {
        setPlaylists(playlistsRes.value.data.result.playlists);
      } else { setPlaylists([]); }

      if (artistsRes.status === "fulfilled" && artistsRes.value.data?.result?.artists) {
        setArtists(artistsRes.value.data.result.artists);
      } else { setArtists([]); }
    } catch (err) {
      console.error("Fetch all data error:", err);
      toast.error("Failed to search comprehensively, please try again");
    } finally {
      setLoading(false);
    }
  }, [keywords]);

  // ── 单分类请求 ──
  const fetchCategoryData = useCallback(async (category: Category) => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      switch (category) {
        case "Songs": {
          const sRes = await searchSongs(keywords, 30);
          setSongs((sRes.data?.data?.resources || []).map(mapResourceToSong));
          break;
        }
        case "Albums": {
          const aRes = await searchAlbums(keywords, 20);
          setAlbums(aRes.data?.result?.albums || []);
          break;
        }
        case "Playlists": {
          const pRes = await searchPlaylists(keywords, 20);
          setPlaylists(pRes.data?.result?.playlists || []);
          break;
        }
        case "Artists": {
          const arRes = await searchArtists(keywords, 20);
          setArtists(arRes.data?.result?.artists || []);
          break;
        }
      }
    } catch (err) {
      console.error(`Fetch ${category} error:`, err);
      toast.error(`${category} search failed`);
    } finally {
      setLoading(false);
    }
  }, [keywords]);

  useEffect(() => {
    if (activeCategory === "All") {
      fetchAllData();
    } else {
      fetchCategoryData(activeCategory);
    }
  }, [keywords, activeCategory, fetchAllData, fetchCategoryData]);

  const topSong = songs[0] ?? null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white p-6 overflow-y-auto pt-22">

      {/* ── 分类胶囊 ── */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95",
              activeCategory === cat
                ? "bg-white text-black"
                : "bg-[#2a2a2a] text-white hover:bg-[#333333]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── 加载占位 ── */}
      {loading && (
        <div className="space-y-4">
          <div className="flex gap-6">
            <div className="w-[40%] h-64 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-[60%] space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-md bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 全部视图 ── */}
      {!loading && activeCategory === "All" && (
        <>
          {/* 顶部两栏：最佳匹配 + 歌曲 */}
          <div className="flex flex-col xl:flex-row gap-6 mb-10">
            {/* 最佳匹配 */}
            <div className="xl:w-[40%] flex flex-col">
              <h2 className="text-2xl font-bold mb-4 tracking-tight">Best Match</h2>
              {topSong ? (
                <div
                  className="relative group bg-[#181818] hover:bg-[#282828] transition-colors rounded-xl p-6 flex-1 cursor-pointer flex flex-col justify-end min-h-55"
                  onClick={() => handlePlaySong(topSong, 0, songs)}
                >
                  <div className="w-24 h-24 mb-5 shadow-2xl rounded-md overflow-hidden bg-zinc-800">
                    <img
                      src={topSong.album?.picUrl || topSong.artists[0]?.picUrl || ""}
                      alt={topSong.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <h3 className="text-3xl font-bold mb-1 truncate">{topSong.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-white hover:underline font-medium">
                      {topSong.artists?.map((a) => a.name).join(", ") || "未知歌手"}
                    </span>
                    <span className="px-2 py-0.5 bg-black/50 rounded-full text-[11px] font-bold tracking-wide uppercase">
                      歌曲
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlaySong(topSong, 0, songs); }}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-[#1ed760] rounded-full flex items-center justify-center text-black opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#3be477] shadow-xl"
                  >
                    {isSongPlaying(topSong.id)
                      ? <Pause className="w-7 h-7 fill-current" />
                      : <Play className="w-7 h-7 fill-current ml-1" />}
                  </button>
                </div>
              ) : (
                <div className="bg-[#181818] rounded-xl p-5 flex-1 flex items-center justify-center text-zinc-500 text-sm">
                  No matching results
                </div>
              )}
            </div>

            {/* 歌曲列表 */}
            <div className="xl:w-[60%] flex flex-col">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Songs</h2>
                {songs.length > 4 && (
                  <button onClick={() => setActiveCategory("Songs")} className="text-sm font-bold text-zinc-400 hover:text-white hover:underline">
                    View All
                  </button>
                )}
              </div>
              <div className="flex flex-col">
                {songs.slice(0, 4).map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    isPlaying={isSongPlaying(song.id)}
                    onTogglePlay={(e) => { e.stopPropagation(); handlePlaySong(song, i, songs); }}
                    onRowClick={() => handlePlaySong(song, i, songs)}
                  />
                ))}
                {songs.length === 0 && <p className="text-zinc-500 text-sm py-4">No song results</p>}
              </div>
            </div>
          </div>

          {/* 歌手网格 */}
          {artists.length > 0 && (
            <div className="mb-10">
              <SectionHeader title="Artists" onSeeAll={() => setActiveCategory("Artists")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {artists.slice(0, 6).map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onClick={() => router.push(`/artist?id=${artist.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 专辑网格 */}
          {albums.length > 0 && (
            <div className="mb-10">
              <SectionHeader title="Albums" onSeeAll={() => setActiveCategory("Albums")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {albums.slice(0, 6).map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    isPlaying={false}
                    isLoading={loadingPlayId === `album-${album.id}`}
                    onTogglePlay={(e) => handlePlayAlbum(album, e)}
                    onClick={() => router.push(`/album?id=${album.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 歌单网格 */}
          {playlists.length > 0 && (
            <div className="mb-10">
              <SectionHeader title="Playlists" onSeeAll={() => setActiveCategory("Playlists")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {playlists.slice(0, 6).map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    isPlaying={false}
                    isLoading={loadingPlayId === `playlist-${playlist.id}`}
                    onTogglePlay={(e) => handlePlayPlaylist(playlist, e)}
                    onClick={() => router.push(`/playlist?id=${playlist.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 歌曲分类视图 ── */}
      {!loading && activeCategory === "Songs" && (
        <div className="pb-10">
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Search Songs</h2>
          <div className="flex flex-col">
            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                isPlaying={isSongPlaying(song.id)}
                onTogglePlay={(e) => { e.stopPropagation(); handlePlaySong(song, i, songs); }}
                onRowClick={() => handlePlaySong(song, i, songs)}
              />
            ))}
            {songs.length === 0 && <p className="text-zinc-500 text-sm py-8 text-center">No results found</p>}
          </div>
        </div>
      )}

      {/* ── 网格分类视图 ── */}
      {!loading && ["Albums", "Playlists", "Artists"].includes(activeCategory) && (
        <div className="pb-10">
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Search {activeCategory}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {activeCategory === "Albums" && albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                isPlaying={false}
                isLoading={loadingPlayId === `album-${album.id}`}
                onTogglePlay={(e) => handlePlayAlbum(album, e)}
                onClick={() => router.push(`/album?id=${album.id}`)}
              />
            ))}
            {activeCategory === "Playlists" && playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                isPlaying={false}
                isLoading={loadingPlayId === `playlist-${playlist.id}`}
                onTogglePlay={(e) => handlePlayPlaylist(playlist, e)}
                onClick={() => router.push(`/playlist?id=${playlist.id}`)}
              />
            ))}
            {activeCategory === "Artists" && artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onClick={() => router.push(`/artist?id=${artist.id}`)}
              />
            ))}
          </div>
          {((activeCategory === "Albums" && albums.length === 0) ||
            (activeCategory === "Playlists" && playlists.length === 0) ||
            (activeCategory === "Artists" && artists.length === 0)) && (
              <p className="col-span-full text-zinc-500 text-sm py-8 text-center">No {activeCategory} results found</p>
            )}
        </div>
      )}

    </div>
  );
}
