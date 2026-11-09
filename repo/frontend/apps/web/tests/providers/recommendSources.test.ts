import { beforeEach, expect, mock, test } from "bun:test";

import type {
  QqPersonalFmDto,
  QqToplistSongsDto,
  QqToplistsDto,
} from "@/types/providers/qq/recommendApi";

const qqToplists = mock(async (_signal?: AbortSignal) => ({}) as QqToplistsDto);
const qqToplistSongs = mock(
  async (_id: string, _page: { offset: number; limit: number }, _signal?: AbortSignal) =>
    ({}) as QqToplistSongsDto,
);
const qqPersonalFm = mock(async (_page: number, _signal?: AbortSignal) => ({}) as QqPersonalFmDto);
const neteaseToplistDetail = mock(async () => ({ data: {} as unknown }));
const neteaseFm = mock(async () => ({ data: {} as unknown }));
const neteaseFmByMode = mock(async (_params: unknown) => ({ data: {} as unknown }));

mock.module("@/lib/providers/qq/api/recommend", () => ({
  getQqToplists: qqToplists,
  getQqToplistSongs: qqToplistSongs,
  getQqPersonalFm: qqPersonalFm,
  getQqDailySongs: mock(async () => ({})),
  getQqNewSongs: mock(async () => ({})),
  getQqRecommendPlaylists: mock(async () => ({})),
}));
mock.module("@/lib/providers/qq/api/playlist", () => ({
  getQqPlaylistDetail: mock(async () => ({})),
}));
mock.module("@/lib/providers/netease/api/toplist", () => ({
  getToplistDetail: neteaseToplistDetail,
}));
mock.module("@/lib/providers/netease/api/personalFm", () => ({
  getPersonalFm: neteaseFm,
  getPersonalFmByMode: neteaseFmByMode,
  trashPersonalFmSong: mock(async () => ({})),
}));

const { qqRecommendSource } = await import("@/lib/providers/qq/recommend");
const { qqPlaylistSource } = await import("@/lib/providers/qq/playlist");
const { neteaseRecommendSource } = await import("@/lib/providers/netease/recommend");

function qqSong(mid: string) {
  return {
    id: 1,
    mid,
    name: mid,
    interval: 200,
    singer: [{ id: 2, mid: "singer", name: "Singer" }],
    album: { id: 3, mid: "albumMid", name: "Album" },
  };
}

beforeEach(() => {
  qqToplists.mockReset();
  qqToplistSongs.mockReset();
  qqPersonalFm.mockReset();
  neteaseToplistDetail.mockReset();
  neteaseFm.mockReset();
  neteaseFmByMode.mockReset();
});

test("lists QQ charts as playlists a platform id cannot be mistaken for", async () => {
  qqToplists.mockResolvedValue({
    code: 200,
    groups: [
      {
        id: 0,
        name: "Peak",
        toplists: [
          {
            id: 26,
            title: "Hot",
            cover: "http://example.test/cover.jpg",
            preview: [{ rank: 1, title: "Song", singer: "Singer" }],
          },
        ],
      },
    ],
  });
  const [chart] = (await qqRecommendSource.getToplists?.()) ?? [];
  expect(chart.ref).toEqual({ provider: "qq", kind: "playlist", id: "toplist:26" });
  expect(chart.coverUrl).toBe("https://example.test/cover.jpg");
  expect(chart.preview).toEqual([{ rank: 1, title: "Song", artist: "Singer" }]);
});

test("reads a QQ chart through the playlist source in backend-sized requests", async () => {
  const chart = { id: 26, title: "Hot", total: 150 };
  qqToplistSongs.mockImplementation(async (_id, page) => ({
    code: 200,
    toplist: chart,
    songs: Array.from({ length: Math.min(page.limit, 150 - page.offset) }, (_, index) =>
      qqSong(`s${page.offset + index}`),
    ),
    total: 150,
    more: page.offset + page.limit < 150,
  }));
  const ref = { provider: "qq", kind: "playlist", id: "toplist:26" } as const;
  const detail = await qqPlaylistSource.getPlaylist(ref);
  expect(detail.title).toBe("Hot");
  expect(detail.trackCount).toBe(150);
  qqToplistSongs.mockClear();
  const page = await qqPlaylistSource.getPlaylistTracks(ref, { offset: 0, limit: 1000 });
  expect(page.tracks).toHaveLength(150);
  expect(qqToplistSongs.mock.calls.map((call) => call[1])).toEqual([
    { offset: 0, limit: 100 },
    { offset: 100, limit: 100 },
  ]);
});

test("continues the QQ personal FM from the page the backend names", async () => {
  qqPersonalFm.mockResolvedValueOnce({
    code: 200,
    page: 1,
    songs: [qqSong("a")],
    more: true,
    station: "personal-fm",
    nextPage: 2,
  });
  qqPersonalFm.mockResolvedValueOnce({
    code: 200,
    page: 2,
    songs: [qqSong("b")],
    more: false,
    station: "personal-fm",
  });
  await qqRecommendSource.getPersonalFmTracks?.();
  await qqRecommendSource.getPersonalFmTracks?.();
  expect(qqPersonalFm.mock.calls.map((call) => call[0])).toEqual([1, 2]);
});

test("puts NetEase's official charts first and drops charts without songs", async () => {
  const chart = (id: number, withTracks = true) => ({
    id,
    name: `Chart ${id}`,
    coverImgUrl: "",
    tracks: withTracks ? [{ first: "Song", second: "Artist" }] : [],
  });
  neteaseToplistDetail.mockResolvedValue({
    data: { code: 200, list: [chart(1), chart(3779629), chart(2, false), chart(19723756)] },
  });
  const charts = (await neteaseRecommendSource.getToplists?.()) ?? [];
  expect(charts.map((item) => item.ref.id)).toEqual(["19723756", "3779629", "1"]);
});

test("asks NetEase's mode endpoint only for a named mode and falls back to the default", async () => {
  neteaseFm.mockResolvedValue({ data: { code: 200, data: [{ id: 7, name: "Seven" }] } });
  neteaseFmByMode.mockResolvedValue({ data: { code: 200, data: [] } });
  const fallback = (await neteaseRecommendSource.getPersonalFmTracks?.({ mode: "EXPLORE" })) ?? [];
  expect(neteaseFmByMode).toHaveBeenCalledTimes(1);
  expect(fallback.map((track) => track.ref.id)).toEqual(["7"]);
  neteaseFmByMode.mockClear();
  await neteaseRecommendSource.getPersonalFmTracks?.({ mode: "DEFAULT" });
  expect(neteaseFmByMode).not.toHaveBeenCalled();
});
