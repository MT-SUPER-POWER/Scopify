import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAritstDetail, getArtistAlbums, getArtistTopSongs, getFansCnt } from "@/lib/api/artist";
import { createPageCacheKey, getPageCache, pageTtlMs, setPageCache } from "@/lib/cache/pageCache";
import { translate } from "@/lib/i18n";
import { useI18nStore } from "@/store/module/i18n";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { Album, ArtistCachePayload, ArtistInfo } from "@/types/artist";

export function useArtistData(artistId: string | null) {
  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [popularTracks, setPopularTracks] = useState<SongDetail[]>([]);
  const [hotTracksQueue, setHotTracksQueue] = useState<SongDetail[]>([]);
  const [discography, setDiscography] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
    let ignore = false;
    const cacheKey = createPageCacheKey("artist", [artistId]);
    Promise.resolve().then(() => setIsLoading(true));

    getPageCache<ArtistCachePayload>(cacheKey).then((cached) => {
      if (ignore || !cached) return;
      setArtist(cached.artist);
      setPopularTracks(cached.popularTracks);
      setHotTracksQueue(cached.hotTracksQueue);
      setDiscography(cached.discography);
      setIsLoading(false);
    });

    Promise.allSettled([
      getAritstDetail(artistId),
      getFansCnt(artistId),
      getArtistTopSongs(artistId),
      getArtistAlbums(artistId, 10),
    ])
      .then(async ([infoRes, fansCntRes, tracksRes, albumsRes]) => {
        if (ignore) return;
        // let fallbackCover = "";
        let nextArtist: ArtistInfo | null = null;
        let nextPopularTracks: SongDetail[] = [];
        let nextDiscography: Album[] = [];

        if (infoRes.status === "fulfilled") {
          const rawArtist = infoRes.value.data?.data?.artist || infoRes.value.data?.artist;
          const fansCnt =
            fansCntRes.status === "fulfilled" ? fansCntRes.value.data?.data?.fansCnt || 0 : 0;
          if (rawArtist) {
            // fallbackCover = rawArtist.cover || rawArtist.picUrl || rawArtist.avatar || rawArtist.img1v1Url || "";
            nextArtist = {
              id: rawArtist.id,
              name: rawArtist.name,
              isVerified: true,
              listeners: fansCnt,
              headerImageUrl: rawArtist.cover || rawArtist.picUrl || "",
              avatar: rawArtist.avatar || rawArtist.img1v1Url || "",
              bio:
                rawArtist.briefDesc ||
                translate(useI18nStore.getState().locale, "artist.about.noBio"),
            };
            setArtist(nextArtist);
          }
        }

        if (tracksRes.status === "fulfilled") {
          // console.log("Hot Song Res:", tracksRes);
          const rawSongs = tracksRes.value.data?.songs || [];
          const pruneSongs = rawSongs.slice(0, 20).map((t: any) => pruneSongDetail(t));
          // const totalSongs = tracksRes.value.data?.total || rawSongs.length;
          // console.log("raw Song", rawSongs);
          // console.log("Pruned Song", pruneSongs);

          nextPopularTracks = pruneSongs;
          setPopularTracks(pruneSongs);
          setHotTracksQueue(pruneSongs);
        }

        if (albumsRes.status === "fulfilled") {
          const rawAlbums = albumsRes.value.data?.hotAlbums || [];
          nextDiscography = rawAlbums.slice(0, 10).map((a: any) => ({
            id: a.id,
            title: a.name,
            releaseYear: a.publishTime ? new Date(a.publishTime).getFullYear() : 0,
            type: a.type || "Album",
            coverUrl: a.picUrl ? `${a.picUrl}?param=300y300` : "",
          }));
          setDiscography(nextDiscography);
        }

        await setPageCache(
          cacheKey,
          {
            artist: nextArtist,
            popularTracks: nextPopularTracks,
            hotTracksQueue: nextPopularTracks,
            discography: nextDiscography,
          },
          pageTtlMs(),
        );
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to fetch artist data:", err);
        toast.error(translate(useI18nStore.getState().locale, "artist.toast.fetchFailed"));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [artistId]);

  return { artist, popularTracks, hotTracksQueue, discography, isLoading };
}
