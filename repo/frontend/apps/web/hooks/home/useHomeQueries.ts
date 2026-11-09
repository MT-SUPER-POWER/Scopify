"use client";

import type { MusicResourceRef } from "@scopify/music-domain/identity";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { throwQueryErrorWithoutData } from "@/lib/query/errorPolicy";

import { getArtistAlbums, getFollowedArtists } from "@/lib/providers/netease/api/artist";
import { getUserAlbumSublist } from "@/lib/providers/netease/api/album";
import { getRecentPlaylists, getUserDetail } from "@/lib/providers/netease/api/user";
import { getRecommendedVoiceLists } from "@/lib/providers/netease/api/voicelist";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";
import { useActiveProvider } from "@/hooks/provider/useActiveProvider";
import { providerQueryKey } from "@/lib/query/providerQueryKey";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { useUserStore } from "@/store";
import type { NeteaseAlbum } from "@/types/providers/netease/albumApi";

/** Playlists anyone gets. The reader is the active platform's; one without it never calls this. */
function useFeaturedPlaylistsOptions(limit: number) {
  const provider = useActiveProvider();
  return queryOptions({
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!provider.getFeaturedPlaylists) throw new Error("Featured playlists are unsupported.");
      return provider.getFeaturedPlaylists(limit, { signal });
    },
    queryKey: providerQueryKey(
      provider.provider,
      ...musicQueryKeys.home.personalizedPlaylists(limit),
    ),
  });
}

export function useFeaturedPlaylistsQuery(limit = 100, boundary = true) {
  return useQuery({
    ...useFeaturedPlaylistsOptions(limit),
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
  });
}

/** 首次加载时挂起，由所在 slot 的 loading.tsx 显示骨架；失败进最近的边界。 */
export function useSuspenseFeaturedPlaylistsQuery(limit = 100) {
  return useSuspenseQuery(useFeaturedPlaylistsOptions(limit));
}

export function useRecommendedPlaylistsQuery(enabled: boolean, boundary = true) {
  const provider = useActiveProvider();
  const accountId = useHomeAccountKey(enabled);
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
    enabled: enabled && Boolean(provider.getRecommendedPlaylists),
    meta: { scope: "account" },
    queryFn: ({ signal }) => {
      if (!provider.getRecommendedPlaylists) {
        throw new Error("Recommended playlists are unsupported.");
      }
      return provider.getRecommendedPlaylists({ signal });
    },
    queryKey: providerQueryKey(
      provider.provider,
      ...musicQueryKeys.home.recommendedPlaylists(accountId),
    ),
  });
}

export function useRecommendedVoiceListsQuery(limit = 24) {
  return useSuspenseQuery({
    meta: { persist: true, scope: "public" },
    queryFn: async () => (await getRecommendedVoiceLists(limit)).data,
    queryKey: musicQueryKeys.home.recommendedVoiceLists(limit),
  });
}

/** The cache segment for the active account; anonymous reads share one. */
function useHomeAccountKey(enabled: boolean): string {
  const account = useActiveAccount();
  return enabled ? (account.profile?.accountId ?? "authenticated") : "anonymous";
}

/** The platform's own home feed; it belongs to the signed-in account. */
export function useHomeFeedQuery() {
  const provider = useActiveProvider();
  const accountId = useHomeAccountKey(true);
  return useSuspenseQuery({
    meta: { scope: "account" },
    queryFn: ({ signal }) => {
      if (!provider.getHomeFeed) throw new Error("The home feed is unsupported.");
      return provider.getHomeFeed({ signal });
    },
    queryKey: providerQueryKey(provider.provider, "home", "feed", accountId),
  });
}

function useFeaturedArtistsOptions(limit: number) {
  const provider = useActiveProvider();
  return queryOptions({
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!provider.getFeaturedArtists) throw new Error("Featured artists are unsupported.");
      return provider.getFeaturedArtists(limit, { signal });
    },
    queryKey: providerQueryKey(provider.provider, ...musicQueryKeys.home.hotArtists(limit)),
  });
}

export function useFeaturedArtistsQuery(limit = 50, boundary = true) {
  return useQuery({
    ...useFeaturedArtistsOptions(limit),
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
  });
}

/** 首次加载时挂起，由所在位置的 Suspense 显示骨架；失败进最近的边界。 */
export function useSuspenseFeaturedArtistsQuery(limit = 50) {
  return useSuspenseQuery(useFeaturedArtistsOptions(limit));
}

export function useHomeUserProfileQuery(userId: null | string) {
  return useQuery({
    enabled: userId !== null,
    meta: { scope: "account" },
    queryFn: async () => {
      if (!userId) throw new Error("A user ID is required to load the profile.");
      return (await getUserDetail(userId)).data;
    },
    queryKey: musicQueryKeys.home.userProfile(userId ?? ""),
  });
}

export function useNewTracksQuery(limit = 12) {
  const provider = useActiveProvider();
  return useSuspenseQuery({
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!provider.getNewTracks) throw new Error("New tracks are unsupported.");
      return provider.getNewTracks(limit, { signal });
    },
    queryKey: providerQueryKey(provider.provider, ...musicQueryKeys.home.newSongs(limit)),
  });
}

export function useToplistsQuery() {
  const provider = useActiveProvider();
  return useSuspenseQuery({
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!provider.getToplists) throw new Error("Toplists are unsupported.");
      return provider.getToplists({ signal });
    },
    queryKey: providerQueryKey(provider.provider, ...musicQueryKeys.home.toplists()),
  });
}

export function useNewAlbumsQuery() {
  const provider = useActiveProvider();
  return useSuspenseQuery({
    meta: { persist: true, scope: "public" },
    queryFn: ({ signal }) => {
      if (!provider.getNewAlbums) throw new Error("New albums are unsupported.");
      return provider.getNewAlbums(20, { signal });
    },
    queryKey: providerQueryKey(provider.provider, ...musicQueryKeys.home.newAlbums()),
  });
}

/** The first songs of a chart, for the card that previews it. */
export function useToplistTracksQuery(toplist: MusicResourceRef<"playlist">) {
  const provider = useActiveProvider();
  return useQuery({
    enabled: Boolean(toplist.id) && toplist.provider === provider.provider,
    meta: { persist: true, scope: "public" },
    queryFn: async ({ signal }) =>
      (await provider.getPlaylistTracks(toplist, { offset: 0, limit: 3 }, { signal })).tracks,
    queryKey: providerQueryKey(provider.provider, ...musicQueryKeys.home.toplistTracks(toplist.id)),
    staleTime: 1000 * 60 * 30,
  });
}

export function useRecentPlaylistsQuery(enabled: boolean, limit = 20) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => (await getRecentPlaylists(limit)).data,
    queryKey: musicQueryKeys.home.recentPlaylists(limit, accountId),
  });
}

export function useFollowedArtistsQuery(enabled: boolean, limit = 30, boundary = true) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: boundary ? throwQueryErrorWithoutData : false,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => {
      const response = await getFollowedArtists(limit);
      if (response.data?.data && useUserStore.getState().user?.userId === userId) {
        useUserStore.getState().setFollowedArtists(response.data.data);
      }
      return response.data;
    },
    queryKey: musicQueryKeys.home.followedArtists(limit, accountId),
  });
}

export function useFollowedArtistsAlbumsQuery(enabled: boolean) {
  const userId = useUserStore((state) => state.user?.userId);
  const accountId = enabled ? (userId ?? "authenticated") : "anonymous";
  return useQuery({
    throwOnError: throwQueryErrorWithoutData,
    enabled,
    meta: { scope: "account" },
    queryFn: async () => {
      const followedRes = await getFollowedArtists(10);
      const artists = followedRes.data?.data ?? [];
      if (artists.length === 0) {
        const subRes = await getUserAlbumSublist({ limit: 20 });
        return (subRes.data?.data ?? []).map((album) => ({
          id: album.id,
          name: album.name,
          picUrl: album.picUrl,
          publishTime: album.subTime,
          artist: { name: "" },
        }));
      }

      const albumPromises = artists.slice(0, 4).map(async (artist) => {
        const res = await getArtistAlbums(artist.id, 5);
        return (res.data.hotAlbums ?? []).map((al) => ({
          id: al.id,
          name: al.name,
          picUrl: al.picUrl,
          publishTime: al.publishTime,
          artist: { id: artist.id, name: artist.name },
        }));
      });
      const results = await Promise.allSettled(albumPromises);
      if (results.every((result) => result.status === "rejected")) {
        const failed = results.find((result) => result.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
      }
      const combined = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      const seen = new Set<number>();
      const uniqueAlbums: NeteaseAlbum[] = [];
      for (const al of combined) {
        if (!seen.has(al.id)) {
          seen.add(al.id);
          uniqueAlbums.push(al);
        }
      }
      return uniqueAlbums;
    },
    queryKey: musicQueryKeys.home.followedArtistAlbums(20, accountId),
  });
}
