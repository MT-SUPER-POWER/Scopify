import { QueryClient } from "@tanstack/react-query";
import { beforeEach, expect, mock, test } from "bun:test";

import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";
import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";

// 单元测试：测试喜欢/取消喜欢的状态同步与 Query 缓存失效

beforeEach(() => {
  useUserStore.setState({ likeListIDs: [100, 200] });
  usePlayerStore.setState({
    currentSongDetail: {
      al: { id: 1, name: "Album", picUrl: "https://example.com/cover.jpg" },
      ar: [{ id: 1, name: "Artist" }],
      dt: 180000,
      fee: 0,
      id: 300,
      name: "Test Song",
      publishTime: 0,
    },
  });
});

test("toggleCurrentSongLike updates store likeListIDs and invalidates queries", async () => {
  const queryClient = new QueryClient();
  const likedPlaylistKey = ["library", "liked-playlist"];
  const userPlaylistsKey = ["library", "playlists"];
  const playlistContentKey = ["playlist", "content"];

  queryClient.setQueryData(likedPlaylistKey, { id: 123, name: "我喜欢的音乐" });
  queryClient.setQueryData(userPlaylistsKey, [
    { coverImgUrl: "old.jpg", id: 123, name: "我喜欢的音乐" },
  ]);
  queryClient.setQueryData(playlistContentKey, { id: 123, tracks: [] });

  // Mock global fetch for likeSong request
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock(async () => {
    return new Response(JSON.stringify({ code: 200 }), { status: 200 });
  }) as unknown as typeof fetch;

  try {
    const isNowLiked = await toggleCurrentSongLike(false, queryClient);

    expect(isNowLiked).toBeTrue();
    expect(useUserStore.getState().likeListIDs).toContain(300);

    expect(queryClient.getQueryState(likedPlaylistKey)?.isInvalidated).toBeTrue();
    expect(queryClient.getQueryState(userPlaylistsKey)?.isInvalidated).toBeTrue();
    expect(queryClient.getQueryState(playlistContentKey)?.isInvalidated).toBeTrue();

    // Toggle unlike
    const isNowUnliked = await toggleCurrentSongLike(false, queryClient);
    expect(isNowUnliked).toBeFalse();
    expect(useUserStore.getState().likeListIDs).not.toContain(300);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
