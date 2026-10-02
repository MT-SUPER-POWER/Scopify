import { describe, expect, it } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { clearConversationsUnreadInCache } from "@/lib/messages/cache";
import type { PrivateConversationResponse } from "@/types/api/privateMessages";

// 私信缓存未读数重置测试

describe("clearConversationsUnreadInCache", () => {
  it("应将指定 peer 的会话 newMsgCount 重设为 0", () => {
    const queryClient = new QueryClient();
    const queryKey = ["privateConversations", "1001", "http://localhost:3000"];

    queryClient.setQueryData(queryKey, {
      pageParams: [0],
      pages: [
        {
          code: 200,
          msgs: [
            {
              fromUser: { userId: 2001, nickname: "Alice" },
              toUser: { userId: 1001, nickname: "Me" },
              lastMsg: '{"msg":"hello"}',
              lastMsgTime: 1700000000000,
              newMsgCount: 3,
            },
            {
              fromUser: { userId: 2002, nickname: "Bob" },
              toUser: { userId: 1001, nickname: "Me" },
              lastMsg: '{"msg":"hey"}',
              lastMsgTime: 1700000001000,
              newMsgCount: 1,
            },
          ],
        },
      ],
    });

    clearConversationsUnreadInCache(queryClient, "1001", "2001");

    const data = queryClient.getQueryData<{
      pages: PrivateConversationResponse[];
    }>(queryKey);

    expect(data?.pages[0].msgs?.[0].newMsgCount).toBe(0);
    expect(data?.pages[0].msgs?.[1].newMsgCount).toBe(1);
  });

  it("当未传递 peerId 时，应一键将所有会话的 newMsgCount 重设为 0（一键全读）", () => {
    const queryClient = new QueryClient();
    const queryKey = ["privateConversations", "1001", "http://localhost:3000"];

    queryClient.setQueryData(queryKey, {
      pageParams: [0],
      pages: [
        {
          code: 200,
          msgs: [
            {
              fromUser: { userId: 2001, nickname: "Alice" },
              toUser: { userId: 1001, nickname: "Me" },
              lastMsg: '{"msg":"hello"}',
              lastMsgTime: 1700000000000,
              newMsgCount: 3,
            },
            {
              fromUser: { userId: 2002, nickname: "Bob" },
              toUser: { userId: 1001, nickname: "Me" },
              lastMsg: '{"msg":"hey"}',
              lastMsgTime: 1700000001000,
              newMsgCount: 2,
            },
          ],
        },
      ],
    });

    clearConversationsUnreadInCache(queryClient, "1001");

    const data = queryClient.getQueryData<{
      pages: PrivateConversationResponse[];
    }>(queryKey);

    expect(data?.pages[0].msgs?.[0].newMsgCount).toBe(0);
    expect(data?.pages[0].msgs?.[1].newMsgCount).toBe(0);
  });
});
