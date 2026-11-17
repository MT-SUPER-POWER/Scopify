import { expect, test } from "bun:test";

import { getOriginalCoverUrl, getSizedImageUrl } from "@/lib/music/imageUrl";

test("QQ album and artist artwork selects supported sizes and caps requests at 1200", () => {
  const album = "https://y.gtimg.cn/music/photo_new/T002R300x300M000albumMid.jpg?query=1#cover";
  const artist = "https://y.qq.com/music/photo_new/T001M000artistMid.jpg";

  expect(getSizedImageUrl(album, 100)).toBe(album);
  expect(getSizedImageUrl(album, 640)).toBe(album.replace("R300x300", "R800x800"));
  expect(getSizedImageUrl(album, 1024)).toBe(album.replace("R300x300", "R1200x1200"));
  expect(getSizedImageUrl(artist, 3000)).toBe(artist.replace("M000", "R1200x1200M000"));
  expect(getOriginalCoverUrl(album)).toBe(album.replace("R300x300", ""));
});

test("QQ playlist artwork uses its own size buckets", () => {
  const cover = "https://qpic.y.qq.com/music_cover/abc/300?n=1#cover";

  expect(getSizedImageUrl(cover, 120)).toBe(cover.replace("/300", "/150"));
  expect(getSizedImageUrl(cover, 256)).toBe(cover);
  expect(getSizedImageUrl(cover, 1024)).toBe(cover.replace("/300", "/600"));
});

test("existing thumbnails and unsupported artwork retain their URL behavior", () => {
  const netease = "https://p1.music.126.net/album.jpg";
  const existing = `${netease}?param=100y100&custom=1`;
  const unsupported = [
    "https://y.gtimg.cn.example.com/music/photo_new/T002M000albumMid.jpg",
    "https://y.gtimg.cn/music/photo_new/T003R600x600M000other.jpg",
    "https://qpic.y.qq.com/profile/avatar/300",
    "/artwork/T002M000local.jpg",
  ];

  expect(getSizedImageUrl(netease, 80)).toBe(`${netease}?param=80y80`);
  expect(getSizedImageUrl(existing, 80)).toBe(existing);
  expect(getOriginalCoverUrl(existing)).toBe(existing);
  expect(getSizedImageUrl(undefined, 80)).toBe("");
  expect(getOriginalCoverUrl(undefined)).toBeNull();

  for (const cover of unsupported) {
    expect(getSizedImageUrl(cover, 800)).toBe(cover);
    expect(getOriginalCoverUrl(cover)).toBe(cover);
  }
});
