import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getAlbumDetail, subscribeAlbum } from "@/lib/api/album";
import { createPageCacheKey, getPageCache, pageTtlMs, setPageCache } from "@/lib/cache/pageCache";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { classifyNetworkError } from "@/lib/web/networkError";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";

const colorCache = new Map<string, string>();
const COLOR_CACHE_LIMIT = 10;
function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    const firstKey = colorCache.keys().next().value;
    if (firstKey !== undefined) colorCache.delete(firstKey);
  }
  colorCache.set(key, value);
}

export interface AlbumInfo {
  type: string;
  subType: string;
  title: string;
  cover: string;
  releaseYear: string;
  artistName: string;
  artistId: number | string | undefined;
  artistAvatar: string;
  company: string;
  totalSongs: number;
  description: string;
}

export function useAlbumData() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const albumId = searchParams.get("id");
  const requireLoginAction = useRequireLoginAction();

  const [albumDetail, setAlbumDetail] = useState<any>(null);
  const [themeColor, setThemeColor] = useState("from-[#88b325]");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isTogglingAlbumSubscribe, setIsTogglingAlbumSubscribe] = useState(false);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const clearAlbumList = useUserStore((s) => s.clearAlbumList);
  const collectedAlbumIds = useUserStore((s) => s.collectedAlbumIds);
  const setCollectedAlbumId = useUserStore((s) => s.setCollectedAlbumId);
  const isAlbumCollected = albumId ? collectedAlbumIds.has(Number(albumId)) : false;

  useEffect(() => { return () => { clearAlbumList(); }; }, [clearAlbumList]);

  const ALBUM_INFO: AlbumInfo | null = useMemo(() => {
    if (!albumDetail) return null;
    const album = albumDetail.album;
    const artist = album.artist || album.artists?.[0];
    return {
      type: album.type || t("album.meta.type"),
      subType: album.subType,
      title: album.name ?? t("album.meta.unknownAlbum"),
      cover: album.picUrl ?? "",
      releaseYear: album.publishTime ? new Date(album.publishTime).toISOString().slice(0, 10) : t("album.meta.unknownYear"),
      artistName: artist?.name ?? t("album.meta.unknownArtist"),
      artistId: artist?.id,
      artistAvatar: artist?.picUrl || artist?.img1v1Url || "",
      company: album.company ?? "",
      totalSongs: album.size ?? 0,
      description: album.description ?? "",
    };
  }, [albumDetail, t]);

  // Dynamic theme color from album cover
  useEffect(() => {
    if (ALBUM_INFO?.cover) {
      const cached = colorCache.get(ALBUM_INFO.cover);
      if (cached) { setThemeColor(cached); return; }
      import("@/lib/utils").then(({ getMainColorFromImage }) => {
        getMainColorFromImage(ALBUM_INFO.cover)
          .then((color: string) => { if (color) { setColorCache(ALBUM_INFO.cover, color); setThemeColor(color); } })
          .catch(() => setThemeColor("#88b325"));
      });
    }
  }, [ALBUM_INFO?.cover]);

  // Fetch album data
  useEffect(() => {
    if (!albumId) return;
    let ignore = false;
    const cacheKey = createPageCacheKey("album", [albumId]);
    setIsLoading(true); setIsError(false);

    getPageCache<{ albumDetail: any; tracks: any[] }>(cacheKey).then((cached) => {
      if (ignore || !cached) return;
      setAlbumDetail(cached.albumDetail);
      useUserStore.getState().setAlbumList(cached.tracks || []);
      setIsLoading(false);
    });

    getAlbumDetail(albumId).then(async (res: any) => {
      if (ignore) return;
      if (!res.data.album || !res.data.songs) { setIsError(true); return; }
      setAlbumDetail(res.data);
      const cover = res.data.album?.picUrl || res.data.album?.blurPicUrl;
      const songs_with_album_pic = res.data.songs.map((song: any) => ({ ...song, al: { ...song.al, picUrl: cover } }));
      useUserStore.getState().setAlbumList(songs_with_album_pic || []);
      await setPageCache(cacheKey, { albumDetail: res.data, tracks: songs_with_album_pic || [] }, pageTtlMs());
    }).catch((error) => {
      if (ignore) return;
      console.error("请求专辑失败:", error);
      setIsError(true);
      if (classifyNetworkError(error).retryable) toast.error(t("network.toast.unavailable"), { id: "network-unavailable" });
      toast.error(t("album.toast.fetchFailed"));
    }).finally(() => { if (!ignore) setIsLoading(false); });

    return () => { ignore = true; };
  }, [albumId, reloadKey, t]);

  const togglePlay = useCallback(() => {
    const state = usePlayerStore.getState();
    const songs = useUserStore.getState().albumList;
    if (!songs.length) return;
    const isCurrentQueue = state.queue.length === songs.length && state.queue[0]?.id === songs[0]?.id;
    if (isCurrentQueue) state.setIsPlaying(!state.isPlaying);
    else { state.setQueue(songs, 0); state.playQueueIndex(0); }
  }, []);

  const handleToggleAlbumSubscribe = useCallback(async () => {
    if (!albumId) return;
    await requireLoginAction("album-subscribe", async () => {
      const numericAlbumId = Number(albumId);
      const nextCollected = !isAlbumCollected;
      setIsTogglingAlbumSubscribe(true);
      setCollectedAlbumId(numericAlbumId, nextCollected);
      try {
        await subscribeAlbum(albumId, nextCollected);
        toast.success(nextCollected ? t("album.toast.subscribeSuccess") : t("album.toast.unsubscribeSuccess"));
      } catch {
        setCollectedAlbumId(numericAlbumId, !nextCollected);
        toast.error(t("album.toast.subscribeFailed"));
      } finally { setIsTogglingAlbumSubscribe(false); }
    });
  }, [albumId, isAlbumCollected, requireLoginAction, setCollectedAlbumId, t]);

  return {
    albumId, ALBUM_INFO, themeColor, isLoading, isError, reloadKey, setReloadKey,
    isPlaying, isShuffle, isAlbumCollected, isTogglingAlbumSubscribe,
    togglePlay, handleToggleAlbumSubscribe,
  };
}
