import { expect, test } from "bun:test";
import dislikeRec from "@/public/data/requestFromDislikeRecommend.json";
import { pruneSongDetail } from "@/types/api/music";

const answ = {
  id: 3317626656,
  name: "失重拥抱",
  dt: 176033,
  ar: [
    {
      id: 121512036,
      name: "Bbcsr",
    },
  ], // 歌手
  al: {
    id: 350276333,
    name: "失重拥抱",
    picUrl: "http://p3.music.126.net/BCqitwc-hWD9AZZIbXLlqQ==/109951172277683155.jpg",
    blurPicUrl: "http://p3.music.126.net/BCqitwc-hWD9AZZIbXLlqQ==/109951172277683155.jpg",
    coverUrl: undefined,
  }, // 专辑
  publishTime: 1762963200000,
};

test("pruneSongDetail Deal with dislike recommendation data", () => {
  const result = pruneSongDetail(dislikeRec.data);
  expect(result).toEqual(answ);
});
