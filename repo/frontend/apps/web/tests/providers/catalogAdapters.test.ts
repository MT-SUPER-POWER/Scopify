import { expect, test } from "bun:test";

import { adaptNeteaseAlbum } from "@/lib/providers/netease/adapters/album";
import { adaptNeteaseArtistAlbum } from "@/lib/providers/netease/adapters/artist";
import { adaptQqAlbum } from "@/lib/providers/qq/adapters/album";
import { adaptQqArtistAlbum, adaptQqArtistDetail } from "@/lib/providers/qq/adapters/artist";
import type { RawSongDetail } from "@/types/song/api";

test("QQ reads an album's songs with the album's artwork and the main artist", () => {
  const { album, tracks } = adaptQqAlbum({
    mid: "000MkMni19ClKG",
    name: "叶惠美",
    aDate: "2003-07-31",
    company: "杰威尔",
    genre: "Pop 流行",
    singermid: "0025NhlN2yWrP4",
    singername: "周杰伦",
    total_song_num: 1,
    list: [
      {
        songid: 97771,
        songmid: "001n4C3p1yv0FU",
        songname: "以父之名",
        interval: 342,
        singer: [{ id: 4558, mid: "0025NhlN2yWrP4", name: "周杰伦" }],
      },
    ],
  });
  expect(album.ref).toEqual({ provider: "qq", kind: "album", id: "000MkMni19ClKG" });
  expect(album.artists[0]?.ref).toEqual({ provider: "qq", kind: "artist", id: "0025NhlN2yWrP4" });
  expect(album.publishedAt).toBe(Date.parse("2003-07-31"));
  expect(album.subType).toBe("Pop 流行");
  expect(tracks[0]?.durationMs).toBe(342000);
  expect(tracks[0]?.album?.coverUrl).toContain("000MkMni19ClKG");
});

test("QQ credits no artist to a compilation instead of linking an empty one", () => {
  const { album } = adaptQqAlbum({ mid: "m", name: "Various", singername: "群星" });
  expect(album.artists[0]?.ref).toBeNull();
  expect(album.artists[0]?.avatarUrl).toBeNull();
  expect(adaptQqAlbum({ mid: "m", name: "No singer" }).album.artists).toEqual([]);
});

test("QQ keeps the follower count unknown and shows no verified badge", () => {
  const artist = adaptQqArtistDetail({ mid: "a", id: 1, name: "A", desc: "bio" }, null);
  expect(artist.followerCount).toBeNull();
  expect(artist.verified).toBe(false);
  expect(artist.coverUrl).toBeNull();
  expect(
    adaptQqArtistAlbum({ albumMid: "x", albumName: "X", albumType: "Single" }).releaseType,
  ).toBe("Single");
});

test("NetEase puts the main artist first and fills missing song artwork from the album", () => {
  const song = {
    id: 1,
    name: "S",
    dt: 1000,
    ar: [{ id: 5, name: "A" }],
    al: { id: 9, name: "Album" },
  } as unknown as RawSongDetail;
  const { album, tracks } = adaptNeteaseAlbum(
    {
      id: 9,
      name: "Album",
      picUrl: "https://p1.music.126.net/c.jpg",
      artist: { id: 5, name: "Main" },
      artists: [
        { id: 6, name: "Guest" },
        { id: 5, name: "Main" },
      ],
      size: 1,
    },
    [song],
    "9",
  );
  expect(album.artists.map((artist) => artist.name)).toEqual(["Main", "Guest"]);
  expect(tracks[0]?.album?.coverUrl).toBe("https://p1.music.126.net/c.jpg");
  expect(
    adaptNeteaseArtistAlbum({ id: 1, name: "N", picUrl: "", publishTime: 0, type: "专辑" }),
  ).toMatchObject({ coverUrl: null, publishedAt: null, releaseType: "专辑" });
});
