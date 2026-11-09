import { beforeEach, expect, mock, test } from "bun:test";

import { ApiError } from "@/lib/web/apiError";
import type {
  QqHotSearchResponseDto,
  QqSearchResponseDto,
  QqSearchSuggestResponseDto,
} from "@/types/providers/qq/searchApi";

const qqSearch = mock(async (..._args: unknown[]) => ({}) as QqSearchResponseDto<unknown>);
const qqHot = mock(async (_signal?: AbortSignal) => ({}) as QqHotSearchResponseDto);
const qqSuggest = mock(
  async (_keyword: string, _signal?: AbortSignal) => ({}) as QqSearchSuggestResponseDto,
);
const neteaseSongs = mock(async (..._args: unknown[]) => ({ data: {} as unknown }));
const neteaseArtists = mock(async (..._args: unknown[]) => ({ data: {} as unknown }));
const neteaseDefault = mock(async (_signal?: AbortSignal) => ({ data: {} as unknown }));
const neteaseSuggest = mock(async (..._args: unknown[]) => ({ data: {} as unknown }));
const neteaseComplex = mock(async (..._args: unknown[]) => ({ data: {} as unknown }));

mock.module("@/lib/providers/qq/api/search", () => ({
  QQ_SEARCH_PAGE_LIMIT: 20,
  searchQq: qqSearch,
  getQqHotSearches: qqHot,
  getQqSearchSuggestions: qqSuggest,
}));
mock.module("@/lib/providers/netease/api/search", () => ({
  searchSongs: neteaseSongs,
  searchArtists: neteaseArtists,
  searchAlbums: mock(async () => ({ data: {} })),
  searchPlaylists: mock(async () => ({ data: {} })),
  searchDefault: neteaseDefault,
  searchSuggest: neteaseSuggest,
  searchComplex: neteaseComplex,
}));

const { qqSearchSource } = await import("@/lib/providers/qq/search");
const { neteaseSearchSource } = await import("@/lib/providers/netease/search");

beforeEach(() => {
  qqSearch.mockReset();
  qqHot.mockReset();
  qqSuggest.mockReset();
  neteaseSongs.mockReset();
  neteaseArtists.mockReset();
  neteaseDefault.mockReset();
  neteaseSuggest.mockReset();
  neteaseComplex.mockReset();
});

function qqSongEntry(mid: string) {
  return {
    id: 1,
    mid,
    name: mid,
    interval: 200,
    singer: [{ id: 2, mid: "singerMid", name: "Singer" }],
    album: { id: 3, mid: "albumMid", name: "Album" },
  };
}

test("QQ turns an offset into a page number and clamps the page size", async () => {
  qqSearch.mockResolvedValue({
    code: 200,
    type: "song",
    page: 3,
    limit: 20,
    more: true,
    items: [qqSongEntry("a"), qqSongEntry("b")],
  });

  const page = await qqSearchSource.search({ keyword: "jay", kind: "song", offset: 40, limit: 30 });

  expect(qqSearch.mock.calls[0]).toEqual(["song", "jay", 3, 20, undefined]);
  expect(page.offset).toBe(40);
  expect(page.nextOffset).toBe(42);
  expect(page.items.map((track) => track.ref)).toEqual([
    { provider: "qq", kind: "track", id: "a" },
    { provider: "qq", kind: "track", id: "b" },
  ]);
  expect(page.items[0].album?.coverUrl).toContain("T002R300x300M000albumMid");
});

test("QQ ends the results when the backend reports no more", async () => {
  qqSearch.mockResolvedValue({
    code: 200,
    type: "song",
    page: 1,
    limit: 20,
    more: false,
    items: [qqSongEntry("a")],
  });
  const page = await qqSearchSource.search({ keyword: "jay", kind: "song", offset: 0, limit: 20 });
  expect(page.nextOffset).toBeNull();
});

test("QQ refuses an offset that is not a whole page", async () => {
  await expect(
    qqSearchSource.search({ keyword: "jay", kind: "song", offset: 7, limit: 20 }),
  ).rejects.toThrow("offset 7");
  expect(qqSearch).not.toHaveBeenCalled();
});

test("QQ artists, albums and playlists use MIDs and the cleaned display text", async () => {
  qqSearch.mockResolvedValueOnce({
    code: 200,
    type: "singer",
    page: 1,
    limit: 20,
    more: false,
    items: [{ singerMID: "0025NhlN2yWrP4", singerName: "周杰伦 (<em>Jay</em> Chou)" }],
  });
  qqSearch.mockResolvedValueOnce({
    code: 200,
    type: "album",
    page: 1,
    limit: 20,
    more: false,
    items: [
      {
        albummid: "000f01724fd7TH",
        name: "Jay",
        singer: "周杰伦 (<em>Jay</em> Chou)",
        publish_date: "2000-11-07",
      },
    ],
  });
  qqSearch.mockResolvedValueOnce({
    code: 200,
    type: "playlist",
    page: 1,
    limit: 20,
    more: false,
    items: [
      {
        dissid: "7039749142",
        dissname: "Mix",
        logo: "http://example.test/cover.jpg",
        nickname: "Someone",
        songnum: 99,
        listennum: 5,
      },
    ],
  });

  const [artists, albums, playlists] = await Promise.all([
    qqSearchSource.search({ keyword: "jay", kind: "artist", offset: 0, limit: 20 }),
    qqSearchSource.search({ keyword: "jay", kind: "album", offset: 0, limit: 20 }),
    qqSearchSource.search({ keyword: "jay", kind: "playlist", offset: 0, limit: 20 }),
  ]);

  expect(artists.items[0]).toMatchObject({
    ref: { provider: "qq", kind: "artist", id: "0025NhlN2yWrP4" },
    name: "周杰伦 (Jay Chou)",
  });
  expect(albums.items[0]).toMatchObject({
    ref: { provider: "qq", kind: "album", id: "000f01724fd7TH" },
    artists: [{ ref: null, name: "周杰伦 (Jay Chou)" }],
    publishedAt: Date.parse("2000-11-07"),
  });
  expect(playlists.items[0]).toMatchObject({
    ref: { provider: "qq", kind: "playlist", id: "7039749142" },
    coverUrl: "https://example.test/cover.jpg",
    trackCount: 99,
    playCount: 5,
  });
});

test("QQ treats an empty hot list or suggestion list as none, and other failures as errors", async () => {
  qqHot.mockRejectedValue(new ApiError({ kind: "business", message: "none", status: 422 }));
  qqSuggest.mockRejectedValueOnce(new ApiError({ kind: "business", message: "none", status: 422 }));
  expect(await qqSearchSource.getHotSearches()).toEqual([]);
  expect(await qqSearchSource.getSearchSuggestions("zz")).toEqual([]);

  qqSuggest.mockRejectedValueOnce(new ApiError({ kind: "backend", message: "down", status: 502 }));
  await expect(qqSearchSource.getSearchSuggestions("zz")).rejects.toThrow("down");

  qqSuggest.mockResolvedValueOnce({ code: 200, keyword: "jay", suggestions: ["周杰伦", "jay-z"] });
  const suggestions = await qqSearchSource.getSearchSuggestions("jay");
  expect(suggestions.map((suggestion) => suggestion.keyword)).toEqual(["周杰伦", "jay-z"]);
});

test("NetEase songs keep their VIP, MV and alias fields and page by the endpoint's own flag", async () => {
  neteaseSongs.mockResolvedValue({
    data: {
      code: 200,
      data: {
        hasMore: true,
        resources: [
          {
            baseInfo: {
              simpleSongData: {
                id: 7,
                name: "Song",
                dt: 1000,
                fee: 1,
                mv: 55,
                alia: ["Alias"],
                ar: [{ id: 9, name: "Artist" }],
                al: { id: 8, name: "Album", picUrl: "https://p1.music.126.net/a.jpg" },
              },
            },
          },
          { baseInfo: {} },
        ],
      },
    },
  });

  const page = await neteaseSearchSource.search({
    keyword: "x",
    kind: "song",
    offset: 30,
    limit: 30,
  });

  expect(page.items).toHaveLength(1);
  expect(page.items[0]).toMatchObject({
    ref: { provider: "netease", kind: "track", id: "7" },
    title: "Song",
    durationMs: 1000,
    netease: { fee: 1, mv: 55, alia: ["Alias"] },
  });
  expect(page.items[0].album?.coverUrl).toBe("https://p1.music.126.net/a.jpg");
  // Two entries were received (one unusable), so the next page starts after both.
  expect(page.nextOffset).toBe(32);
});

test("NetEase stops paging on a short page without a flag and on an explicit end", async () => {
  neteaseArtists.mockResolvedValueOnce({
    data: { code: 200, result: { artists: [{ id: 1, name: "A" }] } },
  });
  expect(
    (await neteaseSearchSource.search({ keyword: "x", kind: "artist", offset: 0, limit: 20 }))
      .nextOffset,
  ).toBeNull();

  neteaseSongs.mockResolvedValueOnce({
    data: {
      code: 200,
      data: { hasMore: false, resources: [{ baseInfo: { simpleSongData: { id: 1 } } }] },
    },
  });
  expect(
    (await neteaseSearchSource.search({ keyword: "x", kind: "song", offset: 0, limit: 1 }))
      .nextOffset,
  ).toBeNull();
});

test("NetEase hot words and suggestions come from the default and suggest endpoints", async () => {
  neteaseDefault.mockResolvedValue({
    data: { code: 200, data: { algWords: [{ keyword: "one" }, { keyword: "two" }] } },
  });
  neteaseSuggest.mockResolvedValue({
    data: {
      code: 200,
      data: {
        suggests: [
          {
            keyword: "jay",
            highLightInfo: JSON.stringify([
              { text: "ja", highLighted: true },
              { text: "y", highLighted: false },
            ]),
            tag: "VIP",
            tagUrl: null,
            skinType: "colorPrimary1",
          },
        ],
      },
    },
  });

  expect(await neteaseSearchSource.getHotSearches()).toEqual([
    { keyword: "one" },
    { keyword: "two" },
  ]);
  expect(await neteaseSearchSource.getSearchSuggestions("ja")).toEqual([
    {
      keyword: "jay",
      highlights: [
        { text: "ja", matched: true },
        { text: "y", matched: false },
      ],
      tag: { label: "VIP", imageUrl: null, emphasized: true },
    },
  ]);
});

test("NetEase overview ranks the best match and keeps the raw reply for podcasts and voices", async () => {
  const response = {
    code: 200,
    data: {
      blocks: [
        {
          blockCode: "search_block_best_match",
          resources: [
            {
              resourceType: "artist",
              baseInfo: {
                artistDTO: { id: 5, name: "Best", picUrl: "https://p1.music.126.net/b.jpg" },
              },
            },
          ],
        },
        {
          blockCode: "search_block_album",
          resources: [
            {
              baseInfo: {
                albumData: {
                  id: 6,
                  name: "Album",
                  picUrl: "https://p1.music.126.net/c.jpg",
                  publishTime: 1000,
                  artists: [{ id: 5, name: "Best" }],
                },
              },
            },
          ],
        },
      ],
    },
  };
  neteaseComplex.mockResolvedValue({ data: response });

  const overview = await neteaseSearchSource.searchOverview?.("best");

  expect(overview?.bestMatch).toMatchObject({
    kind: "artist",
    artist: { ref: { id: "5" }, avatarUrl: "https://p1.music.126.net/b.jpg" },
  });
  expect(overview?.albums[0]).toMatchObject({
    ref: { provider: "netease", kind: "album", id: "6" },
    artists: [{ ref: { id: "5" }, name: "Best" }],
    publishedAt: 1000,
  });
  expect(overview).toMatchObject({ netease: { response } });
});
