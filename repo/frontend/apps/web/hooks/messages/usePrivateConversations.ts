"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPrivateConversations } from "@/lib/api/privateMessages";
import { normalizeConversation } from "@/lib/messages/normalize";
import { getBackendBaseUrl } from "@/lib/web/request";
import type { PrivateConversation } from "@/types/privateMessages";

export function usePrivateConversations(accountId: string | null, enabled: boolean) {
  const query = useInfiniteQuery({
    queryKey: ["privateConversations", accountId, getBackendBaseUrl()],
    enabled: !!accountId && enabled,
    meta: { scope: "account", persist: false },
    initialPageParam: 0,
    gcTime: 0,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
    queryFn: ({ pageParam, signal }) => getPrivateConversations(pageParam, signal),
    getNextPageParam: (page, _pages, offset) => {
      const length = page.msgs?.length ?? 0;
      return length && (page.more ?? page.hasMore ?? length === 30) ? offset + length : undefined;
    },
  });
  const conversations = new Map<string, PrivateConversation>();
  for (const page of query.data?.pages ?? []) {
    for (const row of page.msgs ?? []) {
      const conversation = normalizeConversation(row, accountId ?? "");
      if (conversation && !conversations.has(conversation.id))
        conversations.set(conversation.id, conversation);
    }
  }
  return { ...query, conversations: [...conversations.values()].sort((a, b) => b.time - a.time) };
}
