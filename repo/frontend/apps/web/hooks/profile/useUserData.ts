import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getRecentPlaylists,
  getRecentSongs,
  getUserDetailInfo,
  getUserPlaylists,
} from "@/lib/api/user";
import { getTotalListeningDuration } from "@/lib/api/listeningReport";
import { translate } from "@/lib/i18n";
import { getListeningDurationSeconds } from "@/lib/listeningReport/normalize";
import { getMainColorFromImage } from "@/lib/utils";
import { useI18nStore } from "@/store/module/i18n";
import { useUserStore } from "@/store/module/user";
import { pruneSongDetail } from "@/types/api/music";
import { getPlaylistTrackCount, type RawNeteasePlaylist } from "@/types/api/playlist";
import {
  getRecentSong,
  getRecentSongEntries,
  getRecentSongHistoryCount,
  type NeteaseUser,
  pruneUser,
} from "@/types/api/user";
import type { UserPlaylist } from "@/types/profile";

function toUserPlaylist(playlist: RawNeteasePlaylist): UserPlaylist {
  const creator = playlist.creator
    ? {
        nickname: playlist.creator.nickname ?? "",
        userId: playlist.creator.userId ?? 0,
      }
    : undefined;

  return {
    id: playlist.id ?? 0,
    name: playlist.name ?? "",
    coverImgUrl: playlist.coverImgUrl ?? playlist.picUrl ?? "",
    trackCount: getPlaylistTrackCount(playlist),
    playCount: playlist.playCount ?? 0,
    creator,
  };
}

export function useUserData(uid: string | null) {
  const selfId = useUserStore((s) => s.user?.userId);

  const [userInfo, setUserInfo] = useState<NeteaseUser | null>(null);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [recentPlaybackPlaylist, setRecentPlaybackPlaylist] = useState<UserPlaylist | null>(null);
  const [recentPlaylists, setRecentPlaylists] = useState<UserPlaylist[]>([]);
  const [themeColor, setThemeColor] = useState("#535353");
  const [isLoading, setIsLoading] = useState(true);

  // 是否是自己的主页
  const isSelf = !!uid && !!selfId && String(uid) === String(selfId);

  useEffect(() => {
    if (!uid) return;
    Promise.resolve().then(() => {
      setIsLoading(true);
    }); // 确保在当前事件循环结束后才显示加载状态，避免闪烁

    const songsRequest = isSelf ? getRecentSongs(100) : Promise.resolve(null);
    const recentPlaylistsRequest = isSelf ? getRecentPlaylists(10) : Promise.resolve(null);

    Promise.allSettled([
      getUserDetailInfo({ uid }),
      getUserPlaylists({ uid }),
      songsRequest,
      recentPlaylistsRequest,
    ] as const)
      .then((results) => {
        const [detailRes, playlistsRes, songsRes, recentPlaylistsRes] = results;

        // ── 用户基础信息 ──
        if (detailRes.status === "fulfilled") {
          const raw = detailRes.value.data?.profile;
          const rootData = detailRes.value.data;
          if (raw) {
            const info = pruneUser(raw);

            // Map extended fields
            info.backgroundUrl = raw.backgroundUrl;
            info.level = rootData?.level;
            info.listenSongs = rootData?.listenSongs;
            info.createDays = rootData?.createDays;
            info.createTime = raw.createTime;
            info.province = raw.province;
            info.city = raw.city;
            info.gender = raw.gender;
            info.birthday = raw.birthday;
            info.eventCount = raw.eventCount;
            info.playlistCount = raw.playlistCount;

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
          const raw = playlistsRes.value.data?.playlist ?? [];
          setPlaylists(
            raw.filter((playlist) => playlist.creator?.userId === Number(uid)).map(toUserPlaylist),
          );
        } else {
          toast.error(
            translate(useI18nStore.getState().locale, "profile.toast.loadUserPlaylistsFailed"),
          );
        }

        // ── 自己专属：最近播放虚拟歌单 ──
        if (isSelf && songsRes.status === "fulfilled" && songsRes.value) {
          const response = songsRes.value.data;
          const recentEntries = getRecentSongEntries(response);
          const firstSong = getRecentSong(recentEntries[0] ?? {});

          if (recentEntries.length > 0) {
            setRecentPlaybackPlaylist({
              coverImgUrl: firstSong ? pruneSongDetail(firstSong).al.picUrl : "",
              href: "/recent",
              id: 0,
              isVirtual: true,
              name: translate(useI18nStore.getState().locale, "library.title.recent"),
              playCount: 0,
              trackCount: getRecentSongHistoryCount(response),
            });
          } else {
            setRecentPlaybackPlaylist(null);
          }
        }

        // ── 自己专属：最近播放歌单 ──
        if (isSelf && recentPlaylistsRes.status === "fulfilled") {
          const rawPlaylists = recentPlaylistsRes.value?.data.data?.list ?? [];
          setRecentPlaylists(
            rawPlaylists.slice(0, 10).flatMap(({ data }) => (data ? [toUserPlaylist(data)] : [])),
          );
        }

        if (isSelf) {
          void getTotalListeningDuration()
            .then((response) => {
              const seconds = getListeningDurationSeconds(response.data);
              if (seconds === null) return;

              setUserInfo((current) =>
                current ? { ...current, listenDurationSeconds: seconds } : current,
              );
            })
            .catch(() => {});
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [uid, isSelf]);

  return {
    userInfo,
    playlists,
    recentPlaybackPlaylist,
    recentPlaylists,
    themeColor,
    isLoading,
    isSelf,
  };
}
