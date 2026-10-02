"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearConversationsUnreadInCache } from "@/lib/messages/cache";
import { privateNotificationPeer } from "@/lib/messages/normalize";
import { performNotificationAction } from "@/lib/notifications/actions";
import { runtime } from "@/lib/runtime";
import { useFriendsStore } from "@/store/module/friends";
import { useNotificationStore } from "@/store/module/notifications";

export function useFriendsCenter() {
  const queryClient = useQueryClient();
  const state = useFriendsStore();
  const snapshot = useNotificationStore((store) => store.snapshot);
  const accountId = useNotificationStore((store) => store.accountId);
  useEffect(() => {
    useFriendsStore.getState().selectAccount(accountId);
  }, [accountId]);
  useEffect(() => {
    const item = snapshot?.items.find((item) => item.id === snapshot.focusId);
    const peer = item && privateNotificationPeer(item);
    if (peer) useFriendsStore.getState().openConversation(peer);
  }, [snapshot?.focusId, snapshot?.items]);
  const unread = new Set(
    (snapshot?.items ?? [])
      .filter((item) => item.source === "private" && item.readAt === null)
      .map((item) => privateNotificationPeer(item)?.id)
      .filter(Boolean),
  );

  function readAll() {
    if (!accountId) return;
    const privateUnreadIds = (snapshot?.items ?? [])
      .filter((item) => item.source === "private" && item.readAt === null)
      .map((item) => item.id);
    if (privateUnreadIds.length) {
      void performNotificationAction(() => runtime.notifications.markRead(privateUnreadIds));
    }
    clearConversationsUnreadInCache(queryClient, accountId);
  }

  return {
    ...state,
    open: state.ownerId === accountId && state.open,
    peer: state.ownerId === accountId ? state.peer : null,
    accountId,
    snapshot,
    unreadCount: unread.size,
    onReadAll: readAll,
  };
}
