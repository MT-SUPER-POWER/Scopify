import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { searchAlbums, searchArtists, searchPlaylists, searchSongs } from "@/lib/api/search";
import { createPageCacheKey, getPageCache, searchTtlMs, setPageCache } from "@/lib/cache/pageCache";
import { translate } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import type { Album, Artist, Playlist, Song } from "@/types/search";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Category = "All" | "Songs" | "Artists" | "Playlists" | "Albums";

interface SearchCachePayload {
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  artists: Artist[];
}

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
  const artistPicUrl = s.ar?.[0]?.picUrl && isValidPicUrl(s.ar[0].picUrl) ? s.ar[0].picUrl : null;

  return {
    id: s.id,
    name: s.name || translate(useI18nStore.getState().locale, "common.meta.unknownSong"),
    artists:
      s.ar?.map((a: any) => ({
        id: a.id,
        name: a.name,
        picUrl: isValidPicUrl(a.picUrl) ? a.picUrl : null,
      })) || [],
    album: {
      id: s.al?.id || 0,
      name: s.al?.name || translate(useI18nStore.getState().locale, "common.meta.unknownAlbum"),
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
    const cacheKey = createPageCacheKey("search", [keywords.trim(), "All"]);
    const cached = await getPageCache<SearchCachePayload>(cacheKey);
    if (cached) {
      setSongs(cached.songs);
      setAlbums(cached.albums);
      setPlaylists(cached.playlists);
      setArtists(cached.artists);
      setLoading(false);
    }
    try {
      const [songsRes, albumsRes, playlistsRes, artistsRes] = await Promise.allSettled([
        searchSongs(keywords, 4),
        searchAlbums(keywords, 6),
        searchPlaylists(keywords, 6),
        searchArtists(keywords, 6),
      ]);

      const nextSongs =
        songsRes.status === "fulfilled" && songsRes.value.data?.data?.resources
          ? songsRes.value.data.data.resources.map(mapResourceToSong)
          : [];
      const nextAlbums =
        albumsRes.status === "fulfilled" ? albumsRes.value.data?.result?.albums || [] : [];
      const nextPlaylists =
        playlistsRes.status === "fulfilled" ? playlistsRes.value.data?.result?.playlists || [] : [];
      const nextArtists =
        artistsRes.status === "fulfilled" ? artistsRes.value.data?.result?.artists || [] : [];

      setSongs(nextSongs);
      setAlbums(nextAlbums);
      setPlaylists(nextPlaylists);
      setArtists(nextArtists);
      await setPageCache(
        cacheKey,
        {
          songs: nextSongs,
          albums: nextAlbums,
          playlists: nextPlaylists,
          artists: nextArtists,
        },
        searchTtlMs(),
      );
    } catch (err) {
      console.error("Fetch all data error:", err);
      toast.error(translate(useI18nStore.getState().locale, "search.hook.failedAll"));
    } finally {
      setLoading(false);
    }
  }, [keywords]);

  const fetchCategoryData = useCallback(
    async (category: Category) => {
      if (!keywords.trim()) return;
      setLoading(true);
      const cacheKey = createPageCacheKey("search", [keywords.trim(), category]);
      const cached = await getPageCache<SearchCachePayload>(cacheKey);
      if (cached) {
        setSongs(cached.songs);
        setAlbums(cached.albums);
        setPlaylists(cached.playlists);
        setArtists(cached.artists);
        setLoading(false);
      }
      try {
        let nextSongs: Song[] = [];
        let nextAlbums: Album[] = [];
        let nextPlaylists: Playlist[] = [];
        let nextArtists: Artist[] = [];

        switch (category) {
          case "Songs": {
            const res = await searchSongs(keywords, 30);
            nextSongs = (res.data?.data?.resources || []).map(mapResourceToSong);
            setSongs(nextSongs);
            break;
          }
          case "Albums": {
            const res = await searchAlbums(keywords, 20);
            nextAlbums = res.data?.result?.albums || [];
            setAlbums(nextAlbums);
            break;
          }
          case "Playlists": {
            const res = await searchPlaylists(keywords, 20);
            nextPlaylists = res.data?.result?.playlists || [];
            setPlaylists(nextPlaylists);
            break;
          }
          case "Artists": {
            const res = await searchArtists(keywords, 20);
            nextArtists = res.data?.result?.artists || [];
            setArtists(nextArtists);
            break;
          }
        }
        await setPageCache(
          cacheKey,
          {
            songs: nextSongs,
            albums: nextAlbums,
            playlists: nextPlaylists,
            artists: nextArtists,
          },
          searchTtlMs(),
        );
      } catch (err) {
        console.error(`Fetch ${category} error:`, err);
        const locale = useI18nStore.getState().locale;
        toast.error(
          translate(locale, "search.hook.failedCategory", {
            category: translate(locale, `search.category.${category.toLowerCase()}` as any),
          }),
        );
      } finally {
        setLoading(false);
      }
    },
    [keywords],
  );

  useEffect(() => {
    if (activeCategory === "All") {
      fetchAllData();
    } else {
      fetchCategoryData(activeCategory);
    }
  }, [activeCategory, fetchAllData, fetchCategoryData]);

  return { loading, songs, albums, playlists, artists };
}
