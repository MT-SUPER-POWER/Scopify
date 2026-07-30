"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserAlbumSublist } from "@/lib/api/album";
import { getFollowedArtists } from "@/lib/api/artist";
import {
  getCreatedVoiceLists,
  getLikedVoices,
  getRecommendedPodcasts,
  getSubscribedVoiceLists,
} from "@/lib/api/voicelist";
import { getUserPlaylist } from "@/lib/api/playlist";
import { getRecentSongs } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { type RawNeteasePlaylist } from "@/types/api/playlist";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type {
  CreatedVoiceList,
  LikedVoice,
  RecommendedPodcast,
  SubscribedVoiceList,
} from "@/types/api/voicelist";
import type { RadioDetail } from "@/types/api/radio";
import type { RecentSongHistoryEntry } from "@/types/api/user";
import type { LibraryMediaItem } from "@/types/library";
import type { Artist, Song, Voice } from "@/types/search";

function findLikedPlaylist(playlists: RawNeteasePlaylist[], userId: number) {
  return (
    playlists.find((playlist) => playlist.specialType === 5) ??
    playlists.find(
      (playlist) => playlist.name?.includes("喜欢") && playlist.name?.includes("音乐"),
    ) ??
    playlists.find((playlist) => playlist.creator?.userId === userId) ??
    playlists[0]
  );
}

function getRecentSong(entry: RecentSongHistoryEntry) {
  return entry.data ?? entry.resourceInfo?.songData ?? entry.song;
}

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

export function useLikedPlaylistQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.likedPlaylist(userId ?? 0),
    queryFn: async (): Promise<RawNeteasePlaylist | null> => {
      if (!userId) return null;

      const playlistResponse = await getUserPlaylist(userId, 100);
      const likedPlaylist = findLikedPlaylist(playlistResponse.data.playlist ?? [], userId);
      return likedPlaylist ?? null;
    },
  });
}

export function useRecentSongsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.recentSongs(userId ?? 0),
    queryFn: async (): Promise<SongDetail[]> => {
      const response = await getRecentSongs(100);
      const entries = response.data.data?.list ?? response.data.list ?? [];
      return entries.flatMap((entry) => {
        const song = getRecentSong(entry);
        return song ? [pruneSongDetail(song)] : [];
      });
    },
  });
}

export function useCollectionQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.collection(userId ?? 0),
    queryFn: async () => {
      const [albumsResponse, artistsResponse] = await Promise.all([
        getUserAlbumSublist({ limit: 100 }),
        getFollowedArtists(100),
      ]);

      const albums: LibraryMediaItem[] = (albumsResponse.data.data ?? []).map((album) => ({
        coverUrl: album.picUrl,
        date: album.subTime,
        href: `/album?id=${album.id}`,
        id: album.id,
        subtitle: (album as { size?: number }).size
          ? `${(album as { size?: number }).size} 首歌曲`
          : undefined,
        title: album.name,
      }));
      const artists: LibraryMediaItem[] = (artistsResponse.data.data ?? []).map((artist) => ({
        coverUrl: artist.picUrl ?? artist.img1v1Url ?? artist.avatarUrl,
        date: (artist as { followedTime?: number }).followedTime,
        href: `/artist?id=${artist.id}`,
        id: artist.id,
        isArtist: true,
        title: artist.name,
      }));

      return { albums, artists };
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

export function useLikedVoicesQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
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
