import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { beforeEach, expect, mock, test } from "bun:test";

import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";
import { createSongLikeMutationOptions } from "@/lib/playlist/songLikeMutation";
import { musicQueryKeys } from "@/lib/query/queryKeys";

// 单元测试：测试喜欢/取消喜欢的状态同步与 Query 缓存失效

beforeEach(() => {
  useUserStore.setState({
    likeListIDs: [100, 200],
    user: {
      avatarUrl: "",
      backgroundUrl: "",
      createTime: 0,
      followeds: 0,
      follows: 0,
      nickname: "Tester",
      signature: "",
      userId: 42,
      vipType: 0,
    },
  });
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

test("song like mutation updates store likeListIDs and invalidates queries", async () => {
  const queryClient = new QueryClient();
  const libraryRefreshOperations: string[] = [];
  const mutation = new MutationObserver(
    queryClient,
    createSongLikeMutationOptions(
      queryClient,
      {
        failure: "failed",
        liked: "liked",
        unliked: "unliked",
      },
      {
        clearPageCache: async () => {
          libraryRefreshOperations.push("clear-page-cache");
        },
        mutateSong: async (_songId, like) => {
          libraryRefreshOperations.push(`remote:${like ? "like" : "unlike"}`);
          return { data: { code: 200 } };
        },
      },
    ),
  );
  const likedPlaylistKey = musicQueryKeys.library.likedPlaylist(42);
  const userPlaylistsKey = musicQueryKeys.library.playlists(42);
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
    await mutation.mutate({ like: true, silentToast: true, songId: 300 });

    expect(useUserStore.getState().likeListIDs).toContain(300);

    expect(queryClient.getQueryState(likedPlaylistKey)?.isInvalidated).toBeTrue();
    expect(queryClient.getQueryState(userPlaylistsKey)?.isInvalidated).toBeTrue();
    expect(queryClient.getQueryState(playlistContentKey)?.isInvalidated).toBeTrue();

    // Toggle unlike
    await mutation.mutate({ like: false, silentToast: true, songId: 300 });
    expect(useUserStore.getState().likeListIDs).not.toContain(300);
    expect(libraryRefreshOperations).toEqual([
      "remote:like",
      "clear-page-cache",
      "remote:unlike",
      "clear-page-cache",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
