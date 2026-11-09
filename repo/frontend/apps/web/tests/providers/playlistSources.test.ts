import { beforeEach, expect, mock, test } from "bun:test";

import type { QqPlaylistDetailDto } from "@/types/providers/qq/playlistApi";

const qqDetail = mock(
  async (_disstid: string, _signal?: AbortSignal) => ({}) as QqPlaylistDetailDto,
);
const neteaseDetail = mock(async (_params: unknown) => ({ data: {} as unknown }));
const neteaseTracks = mock(async (_params: unknown) => ({ data: {} as unknown }));
const neteaseUpdate = mock(async (_params: unknown) => ({ code: 200 }));

mock.module("@/lib/providers/qq/api/playlist", () => ({ getQqPlaylistDetail: qqDetail }));
mock.module("@/lib/providers/netease/api/playlist", () => ({
  getPlaylsitDetail: neteaseDetail,
  getPlaylistAllTracks: neteaseTracks,
}));
mock.module("@/lib/providers/netease/api/track", () => ({ updatePlaylistTrack: neteaseUpdate }));

const { qqPlaylistSource } = await import("@/lib/providers/qq/playlist");
const { neteasePlaylistSource } = await import("@/lib/providers/netease/playlist");

const qqRef = { provider: "qq", kind: "playlist", id: "8079077099" } as const;
const neteaseRef = { provider: "netease", kind: "playlist", id: "42" } as const;

function qqSong(mid: string, albumMid = "004BNGWu31cufR") {
  return {
    id: 1,
    mid,
    name: mid,
    interval: 308,
    singer: [{ id: 2, mid: "003Wq2MR32VflK", name: "Singer" }],
    album: { id: 3, mid: albumMid, name: albumMid ? "Album" : "" },
  };
}

const qqPlaylist: QqPlaylistDetailDto = {
  disstid: "8079077099",
  dissname: "Title",
  logo: "https://example.test/cover.jpg",
  desc: "About",
  nickname: "Creator",
  uin: "owSkoi4ioeoFoz**",
  headurl: "https://example.test/avatar.jpg",
  ctime: 1626601422,
  dir_show: 1,
  tags: [
    { id: 165, name: "" },
    { id: 7, name: "Pop" },
  ],
  songnum: 3,
  total_song_num: 3,
  visitnum: 352368,
  songlist: [qqSong("a"), qqSong("b", ""), qqSong("c")],
};

beforeEach(() => {
  qqDetail.mockReset();
  neteaseDetail.mockReset();
  neteaseTracks.mockReset();
  neteaseUpdate.mockReset();
});

test("QQ maps the playlist detail and leaves out what an anonymous read does not report", async () => {
  qqDetail.mockResolvedValue(qqPlaylist);

  const detail = await qqPlaylistSource.getPlaylist(qqRef);

  expect(detail).toEqual({
    ref: qqRef,
    title: "Title",
    coverUrl: "https://example.test/cover.jpg",
    // The anonymous CGI encrypts the creator's account, so there is no account to link.
    creator: { account: null, name: "Creator", avatarUrl: "https://example.test/avatar.jpg" },
    trackCount: 3,
    playCount: 352368,
    description: "About",
    tags: ["Pop"],
    createdAt: 1626601422000,
    visibility: "public",
  });
});

test("QQ pages tracks out of one shared request for detail and tracks", async () => {
  qqDetail.mockResolvedValue(qqPlaylist);

  const [, page] = await Promise.all([
    qqPlaylistSource.getPlaylist(qqRef),
    qqPlaylistSource.getPlaylistTracks(qqRef, { offset: 1, limit: 5 }),
  ]);

  expect(qqDetail).toHaveBeenCalledTimes(1);
  expect(page.offset).toBe(1);
  expect(page.tracks.map((track) => track.ref.id)).toEqual(["b", "c"]);
  // A song without an album has no album, and an album's artwork comes from its MID.
  expect(page.tracks[0].album).toBeNull();
  expect(page.tracks[1].album?.coverUrl).toBe(
    "https://y.gtimg.cn/music/photo_new/T002R300x300M000004BNGWu31cufR.jpg",
  );
  expect(page.tracks[1].durationMs).toBe(308_000);
});

test("NetEase maps the detail and keeps its own fields beside the neutral ones", async () => {
  neteaseDetail.mockResolvedValue({
    data: {
      code: 200,
      playlist: {
        id: 42,
        name: "Liked",
        coverImgUrl: "https://example.test/c.jpg",
        creator: { userId: 7, nickname: "Me", avatarUrl: "" },
        createTime: 1000,
        description: null,
        privacy: 10,
        specialType: 5,
        subscribed: null,
        subscribedCount: 12,
        tags: ["Rock"],
        trackCount: 2,
        trackIds: [{ id: 1 }, { id: 2 }, { id: 3 }],
        playCount: 9,
      },
    },
  });

  const detail = await neteasePlaylistSource.getPlaylist(neteaseRef, { personal: true });

  expect(neteaseDetail.mock.calls[0][0]).toEqual({ id: "42", requiresMusicSession: true });
  expect(detail).toMatchObject({
    ref: neteaseRef,
    title: "Liked",
    creator: { account: { provider: "netease", accountId: "7" }, name: "Me", avatarUrl: null },
    // The ID list is complete when the declared count lags behind.
    trackCount: 3,
    playCount: 9,
    description: "",
    visibility: "private",
    netease: { specialType: 5, subscribed: false, subscribedCount: 12 },
  });
});

test("NetEase asks for the first page without an offset and merges privileges", async () => {
  neteaseTracks.mockResolvedValue({
    data: {
      code: 200,
      songs: [{ id: 5, name: "s", dt: 1000, ar: [], al: { id: 0, name: "", picUrl: "" } }],
      privileges: [{ id: 5, fee: 1, maxBrLevel: "lossless" }],
    },
  });

  const page = await neteasePlaylistSource.getPlaylistTracks(neteaseRef, {
    offset: 0,
    limit: 1000,
  });

  expect(neteaseTracks.mock.calls[0][0]).toEqual({
    id: "42",
    offset: undefined,
    limit: 1000,
    requiresMusicSession: undefined,
  });
  expect(page.tracks[0]).toMatchObject({
    ref: { provider: "netease", kind: "track", id: "5" },
    netease: { fee: 1, privilege: { maxBrLevel: "lossless" } },
  });
});

test("NetEase removes tracks through the playlist track endpoint", async () => {
  await neteasePlaylistSource.removePlaylistTracks?.(neteaseRef, [
    { provider: "netease", kind: "track", id: "5" },
  ]);

  expect(neteaseUpdate.mock.calls[0][0]).toEqual({
    operation: "del",
    playlistId: "42",
    trackId: "5",
  });
});
