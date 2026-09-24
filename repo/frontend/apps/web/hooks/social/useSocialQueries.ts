"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/social";
import { findEvent, socialKey } from "@/lib/social/cache";
import { useUserStore } from "@/store/module/user";
import type { SocialEventTarget, SocialPeopleMode } from "@/types/social";

export function useSocialAccount() {
  const uid = useUserStore((s) => s.user?.userId);
  const loginType = useUserStore((s) => s.loginType);
  return {
    uid: uid ? String(uid) : "",
    account: uid ? String(uid) + ":" + (loginType ?? "") : "guest",
  };
}
export function useSocialFeed(uid?: string, enabled = true) {
  const { account, uid: self } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "events", uid ?? "home"),
    initialPageParam: -1,
    queryFn: ({ pageParam, signal }) => api.fetchEvents(uid, pageParam, signal),
    getNextPageParam: (page) => page.next,
    enabled: enabled && !!self,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}
export function useSocialProfile(uid: string) {
  const { account } = useSocialAccount();
  return useQuery({
    queryKey: socialKey(account, "profile", uid),
    queryFn: ({ signal }) => api.fetchProfile(uid, signal),
    enabled: !!uid,
    staleTime: 60_000,
    retry: 1,
  });
}
export function useSocialPeople(uid: string, mode: SocialPeopleMode, query = "", enabled = true) {
  const { account, uid: self } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "people", mode, uid, query),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.fetchPeople(uid, mode, query, pageParam, signal),
    getNextPageParam: (page) => page.next,
    enabled: enabled && !!self && (mode === "search" ? !!query.trim() : !!uid),
    staleTime: 60_000,
    retry: 1,
  });
}
export function useSocialPlaylists(uid: string, enabled = true) {
  const { account } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "playlists", uid),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.fetchPlaylists(uid, pageParam, signal),
    getNextPageParam: (page) => page.next,
    enabled: !!uid && enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
export function useSocialComments(threadId: string) {
  const { account, uid } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "comments", threadId),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.fetchComments(threadId, pageParam, signal),
    getNextPageParam: (page) => page.next,
    enabled: !!threadId && !!uid,
    staleTime: 15_000,
    retry: 1,
  });
}
export function useSocialMessages(uid: string, enabled: boolean) {
  const { account, uid: self } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "messages", uid),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => api.fetchMessages(uid, pageParam, signal),
    getNextPageParam: (page) => page.next,
    enabled: enabled && !!self && !!uid,
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
export function useSocialResourceSearch(
  query: string,
  kind: "song" | "playlist",
  enabled: boolean,
) {
  const { account } = useSocialAccount();
  return useQuery({
    queryKey: socialKey(account, "resources", kind, query),
    queryFn: ({ signal }) => api.searchResources(query, kind, signal),
    enabled: enabled && !!query.trim(),
    staleTime: 60_000,
    retry: 1,
  });
}
export function useSocialEvent(target: SocialEventTarget) {
  const client = useQueryClient();
  const { account, uid } = useSocialAccount();
  return useQuery({
    queryKey: socialKey(account, "event", target.id, target.uid),
    // A cached event is a complete payload, not a speculative request to a nonexistent detail API.
    initialData: () => findEvent(client, account, target.id),
    queryFn: async ({ signal }) => {
      let cursor = -1;
      for (let page = 0; page < 5; page++) {
        const result = await api.fetchEvents(target.uid, cursor, signal);
        const found = result.items.find((item) => item.id === target.id);
        if (found) return found;
        if (result.next === undefined) break;
        cursor = result.next;
      }
      return null;
    },
    enabled: !!uid && !!target.uid && !!target.id,
    staleTime: Infinity,
    retry: 1,
  });
}
