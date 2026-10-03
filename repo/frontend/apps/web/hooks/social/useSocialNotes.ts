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

/**
 * 聚合查询多个乐迷团的动态笔记（按时间倒序排序与去重）
 * @param groupIds - 乐迷团 ID 列表
 */
export function useSocialAggregatedNotes(groupIds: string[]) {
  const { account, uid } = useSocialAccount();
  const normalizedKey = groupIds.slice().sort().join(",");

  return useInfiniteQuery({
    queryKey: socialKey(account, "events", "community", "aggregated", normalizedKey),
    initialPageParam: {
      cursors: Object.fromEntries(groupIds.map((id) => [id, "0"])) as Record<string, string>,
      hasMore: true,
    },
    queryFn: async ({ pageParam, signal }) => {
      // 对有效游标的乐迷团并发请求第一页/下一页
      const entries = await Promise.all(
        groupIds.slice(0, 6).map(async (gid) => {
          const cursor = pageParam.cursors[gid];
          if (!cursor) return { gid, items: [], next: undefined };
          try {
            const page = await fetchGroupNotes(gid, cursor, signal);
            return { gid, items: page.items, next: page.next };
          } catch {
            return { gid, items: [], next: undefined };
          }
        }),
      );

      const items = entries.flatMap((e) => e.items).sort((a, b) => (b.time ?? 0) - (a.time ?? 0));

      const nextCursors: Record<string, string> = {};
      let hasMore = false;
      for (const entry of entries) {
        if (entry.next) {
          nextCursors[entry.gid] = entry.next;
          hasMore = true;
        }
      }

      return {
        items,
        cursors: nextCursors,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return { cursors: lastPage.cursors, hasMore: lastPage.hasMore };
    },
    enabled: !!uid && groupIds.length > 0,
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  });
}
