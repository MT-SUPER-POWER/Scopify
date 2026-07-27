"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserAlbumSublist } from "@/lib/api/album";
import { getFollowedArtists } from "@/lib/api/artist";
import { getCreatedVoiceLists, getSubscribedPodcasts } from "@/lib/api/library";
import { getPlaylistAllTracks, getUserPlaylist } from "@/lib/api/playlist";
import { getRecentSongs } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import { prunePlaylistTracks, type RawNeteasePlaylist } from "@/types/api/playlist";
import { pruneSongDetail, type SongDetail } from "@/types/api/music";
import type { CreatedVoiceList, RecentSongHistoryEntry } from "@/types/api/library";
import type { LibraryMediaItem } from "@/types/library";

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

function toPodcastItem(podcast: {
  category?: string;
  dj?: { nickname?: string };
  id: number;
  name: string;
  picUrl?: string;
  programCount?: number;
  subCount?: number;
}): LibraryMediaItem {
  return {
    coverUrl: podcast.picUrl,
    id: podcast.id,
    subtitle: podcast.dj?.nickname ?? podcast.category,
    title: podcast.name,
  };
}

function toCreatedPodcastItem(voiceList: CreatedVoiceList): LibraryMediaItem {
  return {
    coverUrl: voiceList.coverUrl ?? voiceList.picUrl,
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

function useLibrarySession() {
  const isLoggedIn = useLoginStatus();
  const userId = useUserStore((state) => state.user?.userId);

  return { isLoggedIn, userId };
}

export function useLikedSongsQuery() {
  const { isLoggedIn, userId } = useLibrarySession();

  return useQuery({
    enabled: isLoggedIn && Boolean(userId),
    queryKey: musicQueryKeys.library.likedSongs(userId ?? 0),
    queryFn: async (): Promise<SongDetail[]> => {
      if (!userId) return [];

      const playlistResponse = await getUserPlaylist(userId, 100);
      const likedPlaylist = findLikedPlaylist(playlistResponse.data.playlist ?? [], userId);
      if (!likedPlaylist?.id) return [];

      const tracksResponse = await getPlaylistAllTracks({ id: likedPlaylist.id, limit: 1000 });
      return prunePlaylistTracks(tracksResponse.data);
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
        href: `/album?id=${album.id}`,
        id: album.id,
        title: album.name,
      }));
      const artists: LibraryMediaItem[] = (artistsResponse.data.data ?? []).map((artist) => ({
        coverUrl: artist.picUrl ?? artist.img1v1Url ?? artist.avatarUrl,
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
      const response = await getSubscribedPodcasts();
      return (response.data.djRadios ?? []).map(toPodcastItem);
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
