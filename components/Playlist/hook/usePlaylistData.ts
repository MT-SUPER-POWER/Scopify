import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/store/module/i18n";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRecommendedSongs } from "@/lib/api/track";
import { getMainColorFromImage } from "@/lib/utils";
import { useUserStore } from "@/store";
import type { PlaylistInfo } from "@/types/playlist";

// 颜色缓存机制 (全局共享)
const colorCache = new Map<string, string>();
colorCache.set("daily", "#c42b2b");
colorCache.set("default", "#88b325");
const COLOR_CACHE_LIMIT = 15;

function setColorCache(key: string, value: string) {
  if (colorCache.size >= COLOR_CACHE_LIMIT) {
    colorCache.delete(colorCache.keys().next().value!);
  }
  colorCache.set(key, value);
}

export function usePlaylist() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");
  const isRecommend = searchParams.get("isRecommend") === "true";
  const isDailyRecommend = searchParams.get("isDailyRecommend") === "true";
  const [rawDetail, setRawDetail] = useState<any>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1. 渲染期状态更新 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const currentReqKey = isDailyRecommend ? "daily" : playlistId;
  const [prevReqKey, setPrevReqKey] = useState<string | null>(null);

  if (currentReqKey !== prevReqKey) {
    setPrevReqKey(currentReqKey);
    setRawDetail(null); // 仅在切换歌单时清空数据（触发 Skeleton 骨架屏）
  }

  // isLoading 派生状态：如果是相同歌单的静默刷新（rawDetail 不为空），不会触发 true，从而避免骨架屏闪烁
  const isLoading = Boolean(currentReqKey) && !rawDetail;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2. 核心数据获取 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const _libraryUpdateTrigger = useUserStore((s) => s.libraryUpdateTrigger);

  useEffect(() => {
    if (!currentReqKey) return;

    let ignore = false;
    const cookie = typeof window !== "undefined" ? localStorage.getItem("music_cookie") || "" : "";

    const fetchMusicData = async () => {
      try {
        if (isDailyRecommend) {
          const res: any = await getRecommendedSongs();
          if (ignore) return;
          const dailySongs = res.data?.data?.dailySongs || [];
          setRawDetail({
            name: t("playlist.meta.dailyTitle"),
            trackCount: dailySongs.length,
            tracks: dailySongs,
          });
          useUserStore.getState().setAlbumList(dailySongs);
        } else {
          const res: any = await getPlaylsitDetail({
            id: playlistId as string,
            cookie: isRecommend ? cookie : undefined,
          });
          if (ignore) return;
          const playlist = res.data.playlist;
          // console.log("Playlist Info:", res.data);
          setRawDetail(playlist);
          useUserStore.getState().setAlbumList(playlist.tracks || []);
        }
      } catch (err) {
        if (ignore) return;
        console.error(err);
        toast.error(
          isDailyRecommend
            ? t("home.toast.loadFailed")
            : t("sidebar.toast.fetchFailed"),
        );
      }
    };

    fetchMusicData();

    return () => {
      ignore = true;
    };
    // 无论是 URL 变了，还是由于你点击了取消喜欢导致 Trigger 变了，都会执行这个 Effect 进行拉取
  }, [currentReqKey, playlistId, isDailyRecommend, isRecommend]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3. 数据派生与格式化 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!rawDetail) return null;

    // console.log("Deriving playlistInfo from rawDetail:", rawDetail);

    if (isDailyRecommend) {
      return {
        isSpecial: true,
        privacy: t("playlist.meta.madeForYou"),
        tags: [t("playlist.meta.dailyTag"), t("playlist.meta.recommendationTag")],
        title: t("playlist.meta.dailyTitle"),
        cover: null,
        createTime: new Date().toLocaleDateString(),
        creator: t("playlist.meta.spotify"),
        creatorID: null,
        creatorAvatar: "",
        likes: "-",
        totalSongs: rawDetail.trackCount ?? 0,
      };
    }

    return {
      isSpecial: false,
      privacy:
        rawDetail.privacy === 0
          ? t("playlist.meta.public")
          : rawDetail.privacy === 10
            ? t("playlist.meta.private")
            : t("playlist.meta.unknownPrivacy"),
      tags: rawDetail.tags ?? [],
      title: rawDetail.name ?? t("playlist.meta.unknown"),
      cover: rawDetail.coverImgUrl ?? `https://picsum.photos/400/400?random=123`,
      createTime: rawDetail.createTime
        ? new Date(rawDetail.createTime).toLocaleDateString()
        : t("playlist.meta.unknownDate"),
      creator: rawDetail.creator?.nickname ?? t("common.meta.unknownUser"),
      creatorID: rawDetail.creator?.userId ?? null,
      creatorAvatar: rawDetail.creator?.avatarUrl ?? "",
      likes: rawDetail.subscribedCount ?? 0,
      totalSongs: rawDetail.trackCount ?? 0,
    };
  }, [rawDetail, isDailyRecommend]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 4. 颜色提取逻辑 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const cachedColor = useMemo(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey) return null;
    return colorCache.get(cacheKey) ?? null;
  }, [isDailyRecommend, playlistInfo?.cover]);

  const [fetchedColor, setFetchedColor] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey || colorCache.has(cacheKey)) return;

    getMainColorFromImage(cacheKey).then((color) => {
      if (color) {
        setColorCache(cacheKey, color);
        setFetchedColor(color);
      }
    });
  }, [isDailyRecommend, playlistInfo?.cover]);

  const themeColor = cachedColor ?? fetchedColor ?? "#88b325";

  return {
    playlistId,
    isDailyRecommend,
    isLoading,
    playlistInfo,
    themeColor,
  };
}
