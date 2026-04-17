import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getRecentPlaylists,
  getRecentSongsByID,
  getUserDetailInfo,
  getUserPlaylists,
} from "@/lib/api/user";
import { translate } from "@/lib/i18n";
import { getMainColorFromImage } from "@/lib/utils";
import { useI18nStore } from "@/store/module/i18n";
import { useUserStore } from "@/store/module/user";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import { type NeteaseUser, pruneUser } from "@/types/api/user";
import type { UserPlaylist } from "@/types/profile";

export function useUserData(uid: string | null) {
  const selfId = useUserStore((s) => s.user?.userId);

  const [userInfo, setUserInfo] = useState<NeteaseUser | null>(null);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [recentSongs, setRecentSongs] = useState<SongDetail[]>([]);
  const [recentPlaylists, setRecentPlaylists] = useState<any[]>([]);
  const [themeColor, setThemeColor] = useState("#535353");
  const [isLoading, setIsLoading] = useState(true);

  // 是否是自己的主页
  const isSelf = !!uid && !!selfId && String(uid) === String(selfId);

  useEffect(() => {
    if (!uid) return;
    Promise.resolve().then(() => {
      setIsLoading(true);
    }); // 确保在当前事件循环结束后才显示加载状态，避免闪烁

    const baseRequests: Promise<any>[] = [getUserDetailInfo({ uid }), getUserPlaylists({ uid })];

    // 只有自己才能拿到最近播放
    const selfRequests: Promise<any>[] = isSelf
      ? [getRecentSongsByID(Number(uid)), getRecentPlaylists(10)]
      : [];

    Promise.allSettled([...baseRequests, ...selfRequests])
      .then((results) => {
        const [detailRes, playlistsRes, songsRes, recentPlaylistsRes] = results;

        // ── 用户基础信息 ──
        if (detailRes.status === "fulfilled") {
          const raw = detailRes.value.data?.profile;
          if (raw) {
            const info = pruneUser(raw);
            setUserInfo(info);
            if (info.avatarUrl) {
              getMainColorFromImage(info.avatarUrl)
                .then((color) => {
                  if (color) setThemeColor(color);
                })
                .catch(() => {});
            }
          }
        } else {
          toast.error(translate(useI18nStore.getState().locale, "profile.toast.loadUserFailed"));
        }

        // ── 创建的歌单（过滤掉收藏的） ──
        if (playlistsRes.status === "fulfilled") {
          const raw: any[] = playlistsRes.value.data?.playlist || [];
          setPlaylists(
            raw
              .filter((p: any) => p.userId === Number(uid))
              .map(
                (p: any): UserPlaylist => ({
                  id: p.id,
                  name: p.name,
                  coverImgUrl: p.coverImgUrl || "",
                  trackCount: p.trackCount ?? 0,
                  playCount: p.playCount ?? 0,
                  creator: p.creator,
                }),
              ),
          );
        } else {
          toast.error(
            translate(useI18nStore.getState().locale, "profile.toast.loadUserPlaylistsFailed"),
          );
        }

        // ── 自己专属：最近播放歌曲 ──
        if (isSelf && songsRes?.status === "fulfilled") {
          const rawSongs = songsRes.value.data?.weekData || [];
          setRecentSongs(rawSongs.slice(0, 15).map((item: any) => pruneSongDetail(item.song)));
        }

        // ── 自己专属：最近播放歌单 ──
        if (isSelf && recentPlaylistsRes?.status === "fulfilled") {
          const rawPlaylists = recentPlaylistsRes.value.data?.data?.list || [];
          setRecentPlaylists(rawPlaylists.slice(0, 10).map((item: any) => item.data));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [uid, isSelf]);

  return { userInfo, playlists, recentSongs, recentPlaylists, themeColor, isLoading, isSelf };
}
