import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { searchSongs, searchPlaylists, searchAlbums, searchArtists } from "@/lib/api/search";
import type { Song, Album, Playlist, Artist } from "../_types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Category = "All" | "Songs" | "Artists" | "Playlists" | "Albums";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HOOK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useSearchData(keywords: string, activeCategory: Category) {
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const fetchAllData = useCallback(async () => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      const [songsRes, albumsRes, playlistsRes, artistsRes] = await Promise.allSettled([
        searchSongs(keywords, 4),
        searchAlbums(keywords, 6),
        searchPlaylists(keywords, 6),
        searchArtists(keywords, 6),
      ]);

      setSongs(songsRes.status === "fulfilled" && songsRes.value.data?.data?.resources
        ? songsRes.value.data.data.resources.map(mapResourceToSong)
        : []);
      setAlbums(albumsRes.status === "fulfilled" ? albumsRes.value.data?.result?.albums || [] : []);
      setPlaylists(playlistsRes.status === "fulfilled" ? playlistsRes.value.data?.result?.playlists || [] : []);
      setArtists(artistsRes.status === "fulfilled" ? artistsRes.value.data?.result?.artists || [] : []);
    } catch (err) {
      console.error("Fetch all data error:", err);
      toast.error("Failed to search comprehensively, please try again");
    } finally {
      setLoading(false);
    }
  }, [keywords]);

  const fetchCategoryData = useCallback(async (category: Category) => {
    if (!keywords.trim()) return;
    setLoading(true);
    try {
      switch (category) {
        case "Songs": {
          const res = await searchSongs(keywords, 30);
          setSongs((res.data?.data?.resources || []).map(mapResourceToSong));
          break;
        }
        case "Albums": {
          const res = await searchAlbums(keywords, 20);
          setAlbums(res.data?.result?.albums || []);
          break;
        }
        case "Playlists": {
          const res = await searchPlaylists(keywords, 20);
          setPlaylists(res.data?.result?.playlists || []);
          break;
        }
        case "Artists": {
          const res = await searchArtists(keywords, 20);
          setArtists(res.data?.result?.artists || []);
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

  return { loading, songs, albums, playlists, artists };
}
