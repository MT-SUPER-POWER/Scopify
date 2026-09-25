"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchGroup, fetchGroupNotes } from "@/lib/api/social";
import { socialKey } from "@/lib/social/cache";
import { useSocialAccount } from "./useSocialQueries";

export function useSocialNotes(groupId: string) {
  const { account, uid } = useSocialAccount();
  return useInfiniteQuery({
    queryKey: socialKey(account, "events", "community", groupId),
    initialPageParam: "0",
    queryFn: ({ pageParam, signal }) => fetchGroupNotes(groupId, pageParam, signal),
    getNextPageParam: (page, pages, _previous, cursors) => {
      if (!page.next || cursors.includes(page.next)) return undefined;
      const seen = new Set(pages.slice(0, -1).flatMap((part) => part.items.map((item) => item.id)));
      return page.items.some((item) => !seen.has(item.id)) ? page.next : undefined;
    },
    enabled: !!uid && /^\d+$/.test(groupId),
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}

export function useSocialGroup(groupId: string) {
  const { account, uid } = useSocialAccount();
  return useQuery({
    queryKey: socialKey(account, "community", groupId),
    queryFn: ({ signal }) => fetchGroup(groupId, signal),
    enabled: !!uid && /^\d+$/.test(groupId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
