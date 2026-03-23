import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAritstDetail, getFansCnt, getArtistTopSongs, getArtistAlbums } from "@/lib/api/artist";
import { pruneSongDetail, SongDetail } from "@/types/api/music";
import { Track, Album, ArtistInfo } from "../_types";

export function useArtistData(artistId: string | null) {
  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [hotTracksQueue, setHotTracksQueue] = useState<SongDetail[]>([]);
  const [discography, setDiscography] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!artistId) return;
    setIsLoading(true);

    Promise.allSettled([
      getAritstDetail(artistId),
      getFansCnt(artistId),
      getArtistTopSongs(artistId),
      getArtistAlbums(artistId, 10),
    ]).then(([infoRes, fansCntRes, tracksRes, albumsRes]) => {
      let fallbackCover = "";

      if (infoRes.status === "fulfilled") {
        const rawArtist = infoRes.value.data?.data?.artist || infoRes.value.data?.artist;
        const fansCnt = fansCntRes.status === "fulfilled"
          ? (fansCntRes.value.data?.data?.fansCnt || 0) : 0;
        if (rawArtist) {
          fallbackCover = rawArtist.cover || rawArtist.picUrl || rawArtist.avatar || rawArtist.img1v1Url || "";
          setArtist({
            id: rawArtist.id,
            name: rawArtist.name,
            isVerified: true,
            listeners: fansCnt,
            headerImageUrl: rawArtist.cover || rawArtist.picUrl || "",
            avatar: rawArtist.avatar || rawArtist.img1v1Url || "",
            bio: rawArtist.briefDesc || "No biography available for this artist.",
          });
        }
      }

      if (tracksRes.status === "fulfilled") {
        const rawSongs = tracksRes.value.data?.hotSongs || [];
        setPopularTracks(rawSongs.slice(0, 10).map((t: any) => ({
          id: t.id,
          title: t.name,
          durationMs: t.dt || t.duration || 0,
          coverUrl: t.al?.picUrl ? `${t.al.picUrl}?param=150y150` : fallbackCover,
          raw: t,
        })));
        setHotTracksQueue(rawSongs.slice(0, 10).map((t: any) => {
          const sd = pruneSongDetail(t);
          if (!sd.al.picUrl) sd.al.picUrl = fallbackCover;
          return sd;
        }));
      }

      if (albumsRes.status === "fulfilled") {
        const rawAlbums = albumsRes.value.data?.hotAlbums || [];
        setDiscography(rawAlbums.slice(0, 10).map((a: any) => ({
          id: a.id,
          title: a.name,
          releaseYear: a.publishTime ? new Date(a.publishTime).getFullYear() : 0,
          type: a.type || "Album",
          coverUrl: a.picUrl ? `${a.picUrl}?param=300y300` : "",
        })));
      }
    }).catch((err) => {
      console.error("Failed to fetch artist data:", err);
      toast.error("加载歌手数据失败");
    }).finally(() => {
      setIsLoading(false);
    });
  }, [artistId]);

  return { artist, popularTracks, hotTracksQueue, discography, isLoading };
}
