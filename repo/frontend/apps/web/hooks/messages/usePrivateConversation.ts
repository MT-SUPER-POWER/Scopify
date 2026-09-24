"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getPrivateHistory, sendPrivateText } from "@/lib/api/privateMessages";
import { normalizeMessage, privateNotificationPeer } from "@/lib/messages/normalize";
import { performNotificationAction } from "@/lib/notifications/actions";
import { getBackendBaseUrl } from "@/lib/web/request";
import { runtime } from "@/lib/runtime";
import { useFriendsStore } from "@/store/module/friends";
import { useNotificationStore } from "@/store/module/notifications";
import type { MessagePeer, PrivateMessage } from "@/types/privateMessages";

export function usePrivateConversation(accountId: string, peer: MessagePeer) {
  const queryClient = useQueryClient();
  const draft = useFriendsStore((state) => state.drafts[peer.id] ?? "");
  const setDraft = (text: string) => useFriendsStore.getState().setDraft(peer.id, text);
  const readAttempt = useRef("");
  const sendLock = useRef(false);
  const snapshot = useNotificationStore((state) => state.snapshot);
  const pending = useNotificationStore((state) => state.pending);
  const queryKey = ["privateHistory", accountId, getBackendBaseUrl(), peer.id];
  const mutationKey = ["privateSend", accountId, peer.id];
  const sending = useIsMutating({ mutationKey }) > 0;
  const history = useInfiniteQuery({
    queryKey,
    meta: { scope: "account", persist: false },
    initialPageParam: 0,
    gcTime: 0,
    staleTime: 0,
    refetchInterval: 15_000,
    retry: false,
    queryFn: ({ pageParam, signal }) => getPrivateHistory(peer.id, pageParam, signal),
    getNextPageParam: (page, _pages, before) => {
      const rows = page.msgs ?? [];
      const times = rows.map((row) => row.time ?? 0).filter((time) => time > 0);
      const oldest = Math.min(...times);
      return rows.length &&
        (page.more ?? page.hasMore ?? rows.length === 30) &&
        Number.isFinite(oldest) &&
        (!before || oldest < before)
        ? oldest
        : undefined;
    },
  });
  const messages = useMemo(() => {
    const unique = new Map<string, PrivateMessage>();
    for (const page of history.data?.pages ?? []) {
      for (const row of page.msgs ?? []) {
        const message = normalizeMessage(row, accountId, peer);
        if (!unique.has(message.id)) unique.set(message.id, message);
      }
    }
    return [...unique.values()].sort((a, b) => a.time - b.time);
  }, [history.data, accountId, peer]);
  const newestTime = messages.at(-1)?.time ?? 0;
  useEffect(() => {
    if (!history.isSuccess || pending || snapshot?.accountId !== accountId) return;
    const ids = snapshot.items
      .filter(
        (item) =>
          (item.readAt === null || item.id === snapshot.focusId) &&
          item.occurredAt <= newestTime &&
          privateNotificationPeer(item)?.id === peer.id,
      )
      .map((item) => item.id);
    const attempt = history.dataUpdatedAt + ":" + ids.join(",");
    if (!ids.length || readAttempt.current === attempt) return;
    readAttempt.current = attempt;
    void performNotificationAction(() => runtime.notifications.markRead(ids));
  }, [history.isSuccess, history.dataUpdatedAt, pending, snapshot, accountId, newestTime, peer.id]);
  const send = useMutation({
    mutationKey,
    meta: { scope: "account" },
    retry: false,
    mutationFn: async (text: string) => {
      if (useNotificationStore.getState().accountId !== accountId)
        throw new Error("session-changed");
      const result = await sendPrivateText(peer.id, text);
      if (result.code !== 200) throw new Error("message-send-failed");
      return result;
    },
    onSuccess: async (_result, sentText) => {
      if (useNotificationStore.getState().accountId !== accountId) return;
      if (useFriendsStore.getState().drafts[peer.id]?.trim() === sentText) setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["privateConversations", accountId] }),
      ]);
    },
  });
  async function sendMessage() {
    const text = draft.trim();
    if (
      !text ||
      draft.length > 1000 ||
      sendLock.current ||
      queryClient.isMutating({ mutationKey }) > 0 ||
      peer.id === accountId
    )
      return;
    sendLock.current = true;
    try {
      await send.mutateAsync(text);
    } catch {
      /* The composer keeps the draft and shows the mutation error. */
    } finally {
      sendLock.current = false;
    }
  }
  return {
    ...history,
    messages,
    draft,
    setDraft,
    sendMessage,
    sending,
    sendError: send.isError,
  };
}
