import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { PrivateConversationResponse } from "@/types/api/privateMessages";

// 私信会话列表的 React Query 缓存管理

/**
 * 清除私信会话列表在 React Query 缓存中的未读计数
 * @param queryClient - React Query 客户端实例
 * @param accountId - 当前登录账号 ID
 * @param peerId - 可选的好友 ID；若不提供则重置所有会话的未读计数
 */
export function clearConversationsUnreadInCache(
  queryClient: QueryClient,
  accountId: string,
  peerId?: string,
) {
  queryClient.setQueriesData<InfiniteData<PrivateConversationResponse>>(
    { queryKey: ["privateConversations", accountId] },
    (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          msgs: page.msgs?.map((row) => {
            const from = row.fromUser?.userId != null ? String(row.fromUser.userId) : "";
            const to = row.toUser?.userId != null ? String(row.toUser.userId) : "";
            const matches = !peerId || from === peerId || to === peerId;
            if (matches && (row.newMsgCount ?? 0) > 0) {
              return { ...row, newMsgCount: 0 };
            }
            return row;
          }),
        })),
      };
    },
  );
}
