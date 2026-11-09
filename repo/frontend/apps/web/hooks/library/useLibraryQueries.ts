"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getFollowedArtists } from "@/lib/providers/netease/api/artist";
import {
  getCreatedVoiceLists,
  getLikedVoices,
  getRecommendedPodcasts,
  getSubscribedVoiceLists,
} from "@/lib/providers/netease/api/voicelist";
import { fetchNeteaseUserPlaylists } from "@/lib/providers/netease/library";
import { getRecentSongs } from "@/lib/providers/netease/api/user";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";
import { useUserStore } from "@/store";
import { prunePlaylist, type NeteasePlaylist } from "@/types/playlist/api";
import { pruneSongDetail, type SongDetail } from "@/types/song/api";
import type {
  CreatedVoiceList,
  LikedVoice,
  RecommendedPodcast,
  SubscribedVoiceList,
} from "@/types/voice/api";
import type { RadioDetail } from "@/types/radio/api";
import { getRecentSong, getRecentSongEntries } from "@/types/user/api";
import type { LibraryMediaItem } from "@/types/library/model";
import type { Artist, Song, Voice } from "@/types/search/model";

function toCreatedPodcastItem(voiceList: CreatedVoiceList): LibraryMediaItem {
  return {
    coverUrl: voiceList.coverUrl ?? voiceList.picUrl,
    date: (voiceList as { createTime?: number }).createTime,
    id: voiceList.id,
    subtitle: voiceList.creator?.nickname,
    title: voiceList.name,
  };
}

function getCreatedVoiceListItems(
  response: Awaited<ReturnType<typeof getCreatedVoiceLists>>["data"],
) {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  return payload?.list ?? payload?.data ?? response.list ?? [];
}

function getRecommendedPodcastItems(
  response: Awaited<ReturnType<typeof getRecommendedPodcasts>>["data"],
): RecommendedPodcast[] {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;

  return (
    payload?.data ??
    payload?.djRadios ??
    payload?.radios ??
    payload?.recommend ??
    response.djRadios ??
    []
  );
}

function toSubscribedPodcast(voiceList: SubscribedVoiceList): RadioDetail {
  const hasHost = Boolean(voiceList.userName || voiceList.userId);

  return {
    category: voiceList.categoryName,
    createTime: voiceList.createTime,
    desc: voiceList.desc,
    dj: hasHost
      ? {
          nickname: voiceList.userName,
          userId: voiceList.userId,
        }
      : null,
    id: voiceList.voiceListId,
    lastProgramCreateTime: voiceList.lastProgramCreateTime,
    latestEpisodeName: voiceList.voiceName,
    name: voiceList.voiceListName,
    newVoiceCount: voiceList.newVoiceCount,
    picUrl: voiceList.coverUrl,
    playCount: voiceList.playCount,
    programCount: voiceList.voiceCount,
    secondCategory: voiceList.secondCategoryName,
    subCount: voiceList.subCount,
  };
}

function getLikedVoiceItems(
  response: Awaited<ReturnType<typeof getLikedVoices>>["data"],
): LikedVoice[] {
  const payload = response.data;
  if (Array.isArray(payload)) return payload;

  return (
    payload?.contentVOList ??
    payload?.contentList ??
    payload?.data ??
    payload?.list ??
    response.contentVOList ??
    []
  );
}

function toLikedVoiceArtist(source: { id?: number; name?: string; picUrl?: string }): Artist {
  return {
    id: source.id ?? 0,
    name: source.name ?? "",
    picUrl: source.picUrl ?? null,
  };
}

function toLikedVoiceSong(source: LikedVoice): Song | null {
  const song = source.mainSong ?? source.djProgram?.mainSong;
  if (!song?.id) return null;

  const artists = (song.artists ?? song.ar ?? []).map(toLikedVoiceArtist);
  const album = song.album ?? song.al;

  return {
    album: {
      artist: artists[0] ?? { id: 0, name: "", picUrl: null },
      id: album?.id ?? 0,
      name: album?.name ?? "",
      picUrl: album?.picUrl ?? album?.blurPicUrl,
      publishTime: 0,
      size: 0,
    },
    artists,
    duration: song.duration ?? song.dt ?? 0,
    id: song.id,
    name: song.name ?? "",
  };
}

function toLikedVoice(source: LikedVoice): Voice | null {
  const id = Number(source.voiceId ?? source.id ?? source.contentId);
  const name = source.voiceName ?? source.name ?? source.contentName;
  if (!Number.isFinite(id) || !name) return null;

  const mainSong = toLikedVoiceSong(source);
  const displayStatus = source.displayStatus ?? source.disPlayStatus;
  return {
    auditStatus: source.auditStatus,
    coverUrl:
      source.coverUrl ?? source.picUrl ?? source.contentCoverUrl ?? mainSong?.album.picUrl ?? "",
    description: source.voiceDesc,
    displayStatus,
    duration: source.duration ?? mainSong?.duration ?? 0,
    hostName: source.userName ?? source.dj?.nickname ?? source.djProgram?.dj?.nickname,
    id,
    isPlayable:
      (displayStatus === undefined || displayStatus === null || displayStatus === "ONLINE") &&
      source.auditStatus !== "AUDIT_FAILED",
    lastPlayTime: source.lastPlayTime,
    likeTime: source.likeTime,
    mainSong,
    name,
    podcastName: source.voiceListName ?? source.radioName ?? "",
    playCount: source.playCount,
    publishTime: source.publishTime,
  };
}

function useLibrarySession() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);

  return { isLoggedIn, userId };
}

export function useRecentSongsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.recentSongs(userId ?? 0),
    queryFn: async (): Promise<SongDetail[]> => {
      const response = await getRecentSongs(100);
      const entries = getRecentSongEntries(response.data);
      return entries.flatMap((entry) => {
        const song = getRecentSong(entry);
        return song ? [pruneSongDetail(song)] : [];
      });
    },
  });
}

/** The artists the account follows; following is NetEase's, so other platforms stay idle. */
export function useFollowedArtistsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();
  const canFollow = useProviderCapability("artist.follow");

  return useQuery({
    enabled: canFollow && isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.collection(userId ?? 0),
    queryFn: async () => {
      const artistsResponse = await getFollowedArtists(100);

      if (artistsResponse.data.data) {
        useUserStore.getState().setFollowedArtists(artistsResponse.data.data);
      }

      const artists: LibraryMediaItem[] = (artistsResponse.data.data ?? []).map((artist) => ({
        coverUrl: artist.picUrl ?? artist.img1v1Url ?? artist.avatarUrl,
        date: (artist as { followedTime?: number }).followedTime,
        href: `/artist?id=${artist.id}`,
        id: artist.id,
        isArtist: true,
        title: artist.name,
      }));

      return { artists };
    },
  });
}

export function useSubscribedPodcastsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.subscribedPodcasts(userId ?? 0),
    queryFn: async () => {
      const response = await getSubscribedVoiceLists();
      return (response.data.data?.data ?? []).map(toSubscribedPodcast);
    },
  });
}

export function useRecommendedPodcastsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.recommendedPodcasts(userId ?? 0),
    queryFn: async () => {
      const response = await getRecommendedPodcasts();
      return getRecommendedPodcastItems(response.data);
    },
  });
}

export function useLikedVoicesQuery(enabled = true) {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: enabled && isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.likedVoices(userId ?? 0),
    queryFn: async (): Promise<Voice[]> => {
      const response = await getLikedVoices();
      return getLikedVoiceItems(response.data).flatMap((voice) => {
        const likedVoice = toLikedVoice(voice);
        return likedVoice ? [likedVoice] : [];
      });
    },
  });
}

export function useCreatedPodcastsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.createdPodcasts(userId ?? 0),
    queryFn: async () => {
      const response = await getCreatedVoiceLists();
      return getCreatedVoiceListItems(response.data).map(toCreatedPodcastItem);
    },
  });
}

export function useUserPlaylistsQuery(throwOnError = false) {
  const { isLoggedIn, userId } = useLibrarySession();

  const query = useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.neteasePlaylists(userId ?? 0),
    throwOnError: throwOnError ? throwQueryErrorWithoutData : false,
    meta: { persist: true, scope: "account" },
    queryFn: async (): Promise<NeteasePlaylist[]> => {
      if (!userId) throw new Error("Missing user ID.");
      return (await fetchNeteaseUserPlaylists(userId)).map(prunePlaylist);
    },
  });
  useEffect(() => {
    if (!isLoggedIn || !userId || query.data === undefined) return;
    if (Number(useUserStore.getState().user?.userId) !== userId) return;
    useUserStore.setState({ playlist: query.data });
  }, [isLoggedIn, query.data, userId]);
  return query;
}
