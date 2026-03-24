// NOTE: 如何拆分一个组件的 HOOKS 部分

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRecommendedSongs } from "@/lib/api/track";
import { useUserStore } from "@/store";
import { toast } from "sonner";
import { getMainColorFromImage } from "@/lib/utils";
import { PlaylistInfo } from "@app-types/playlist";
import { SongDetail } from "@/types/api/music";

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
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");
  const isRecommend = searchParams.get("isRecommend") === "true";
  const isDailyRecommend = searchParams.get("isDailyRecommend") === "true";

  const [rawDetail, setRawDetail] = useState<any>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 官方推荐做法：渲染期更新与派生状态 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 生成当前请求的唯一标识
  const currentReqKey = isDailyRecommend ? "daily" : playlistId;
  const [prevReqKey, setPrevReqKey] = useState<string | null>(null);

  // 【核心 1：渲染期状态更新】
  // 当路由变化，currentReqKey 改变时，直接在渲染阶段清空旧数据。
  // 这会告诉 React 丢弃本次渲染，立即用新状态重绘，避免了放入 useEffect 导致的级联渲染。
  if (currentReqKey !== prevReqKey) {
    setPrevReqKey(currentReqKey);
    setRawDetail(null); // 立刻丢弃旧歌单数据
  }

  // 【核心 2：派生状态】
  // 只要我们需要请求数据 (currentReqKey 存在)，并且当前还没拿到数据，就是 Loading。
  // 彻底干掉独立的 isLoading 状态和 setIsLoading 同步调用。
  const isLoading = Boolean(currentReqKey) && !rawDetail;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


  // 1. 数据请求逻辑
  useEffect(() => {
    if (!currentReqKey) return;

    let ignore = false;
    const cookie = typeof window !== 'undefined' ? localStorage.getItem("music_cookie") || "" : "";

    const fetchMusicData = async () => {
      try {
        if (isDailyRecommend) {
          const res: any = await getRecommendedSongs();
          const dailySongs = res.data?.data?.dailySongs || [];
          if (ignore) return;

          // 在异步回调中 setState，Lint 不会报同步更新错误
          setRawDetail({ name: "每日推荐", trackCount: dailySongs.length, tracks: dailySongs });
          useUserStore.getState().setAlbumList(dailySongs);
        } else {
          const res: any = await getPlaylsitDetail({ id: playlistId as string, cookie: isRecommend ? cookie : undefined });
          const playlist = res.data.playlist;
          if (ignore) return;

          setRawDetail(playlist);
          useUserStore.getState().setAlbumList(playlist.tracks || []);
        }
      } catch (err) {
        if (ignore) return;
        console.error(err);
        toast.error(isDailyRecommend ? "获取每日推荐失败" : "获取歌单详情失败");
      }
    };

    fetchMusicData();

    return () => { ignore = true; };
  }, [currentReqKey, playlistId, isDailyRecommend, isRecommend]);

  // 2. 数据格式化逻辑 (将杂乱的 API 返回抹平为统一的 PlaylistInfo)
  const playlistInfo = useMemo<PlaylistInfo | null>(() => {
    if (!rawDetail) return null;

    if (isDailyRecommend) {
      return {
        isSpecial: true,
        privacy: "Made For You",
        tags: ["Daily", "Recommendation"],
        title: "每日推荐",
        cover: null,
        createTime: new Date().toLocaleDateString(),
        creator: "Spotify",
        creatorAvatar: "",
        likes: "-",
        totalSongs: rawDetail.trackCount ?? 0,
      };
    }

    return {
      isSpecial: false,
      privacy: rawDetail.privacy === 0 ? "Public Playlist" : rawDetail.privacy === 10 ? "Private Playlist" : "Unknown Privacy",
      tags: rawDetail.tags ?? [],
      title: rawDetail.name ?? "Unknown",
      cover: rawDetail.coverImgUrl ?? `https://picsum.photos/300/300?random=123`,
      createTime: rawDetail.createTime ? new Date(rawDetail.createTime).toLocaleDateString() : "Unknown Date",
      creator: rawDetail.creator?.nickname ?? "Unknown User",
      creatorAvatar: rawDetail.creator?.avatarUrl ?? "",
      likes: rawDetail.subscribedCount ?? 0,
      totalSongs: rawDetail.trackCount ?? 0,
    };
  }, [rawDetail, isDailyRecommend]);

  // 3. 颜色提取逻辑

  // 同步部分：缓存命中直接算出来，不走 effect，彻底消除级联渲染警告
  const cachedColor = useMemo(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey) return null;
    return colorCache.get(cacheKey) ?? null;
  }, [isDailyRecommend, playlistInfo?.cover]);

  // 异步部分：只有缓存未命中时才需要 fetch
  const [fetchedColor, setFetchedColor] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = isDailyRecommend ? "daily" : playlistInfo?.cover;
    if (!cacheKey || colorCache.has(cacheKey)) return; // 缓存命中直接跳过

    getMainColorFromImage(cacheKey).then((color) => {
      if (color) {
        setColorCache(cacheKey, color);
        setFetchedColor(color);
      }
    });
  }, [isDailyRecommend, playlistInfo?.cover]);

  // 合并：优先用缓存色，其次是异步色，最后兜底
  const themeColor = cachedColor ?? fetchedColor ?? "#88b325";

  return {
    playlistId,
    isDailyRecommend,
    isLoading,
    playlistInfo,
    themeColor,
  };
}
