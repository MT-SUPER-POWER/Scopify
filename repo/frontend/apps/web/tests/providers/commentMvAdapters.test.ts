import { describe, expect, it } from "bun:test";

import { adaptNeteaseComment } from "@/lib/providers/netease/adapters/comment";
import { adaptNeteaseMvDetail } from "@/lib/providers/netease/adapters/mv";
import { adaptQqComment } from "@/lib/providers/qq/adapters/comment";
import { adaptQqMvStream } from "@/lib/providers/qq/adapters/mv";
import type { NeteaseComment } from "@/types/song/api";
import type { QqMvUrlDto } from "@/types/providers/qq/mvApi";

describe("NetEase comment adapter", () => {
  it("keeps the quote, the reply count and a cleaned location", () => {
    const raw = {
      commentId: 7,
      user: { userId: 3, nickname: "Ann", avatarUrl: "https://a/b.jpg" },
      content: "hello",
      timeStr: "3天前",
      time: 1_700_000_000_000,
      likedCount: 4,
      liked: true,
      beReplied: [{ user: { nickname: "Bob" }, beRepliedCommentId: 5, content: "该评论已删除" }],
      showFloorComment: { replyCount: 2 },
      ipLocation: { location: "IP属地：上海" },
    } as unknown as NeteaseComment;
    const comment = adaptNeteaseComment(raw);
    expect(comment).toMatchObject({
      id: "7",
      likeCount: 4,
      liked: true,
      replyCount: 2,
      location: "上海",
      timeLabel: "3天前",
      author: { id: "3", name: "Ann" },
      quote: { commentId: "5", authorName: "Bob", content: null },
    });
  });
});

describe("QQ comment adapter", () => {
  it("converts seconds to milliseconds and leaves unknown fields empty", () => {
    const comment = adaptQqComment({ id: "1!x", content: "hi", nick: "Zed", time: 100 });
    expect(comment.createdAt).toBe(100_000);
    expect(comment.author.id).toBeNull();
    expect(comment.liked).toBeNull();
    expect(comment.likeCount).toBe(0);
  });
});

describe("MV adapters", () => {
  it("reads NetEase qualities from the detail", () => {
    const detail = adaptNeteaseMvDetail({
      id: 1,
      name: "t",
      duration: 1000,
      brs: [
        { br: 480, size: 10 },
        { br: 1080, size: 0 },
      ],
    });
    expect(detail.qualities).toEqual([
      { height: 480, sizeBytes: 10 },
      { height: 1080, sizeBytes: null },
    ]);
    expect(detail.durationMs).toBe(1000);
  });

  const dto: QqMvUrlDto = {
    code: 200,
    vid: "v",
    files: [
      { quality: 10, urls: ["http://host/", "https://host/a.mp4?x=1"] },
      { quality: 30, urls: ["http://host/b.mp4"] },
      { quality: 20, urls: ["https://host/c.mp4"] },
      { quality: 99, urls: ["https://host/d.mp4"] },
    ],
  };

  it("serves the best QQ file at or below the wanted height over HTTPS", () => {
    expect(adaptQqMvStream(dto)).toMatchObject({ url: "https://host/b.mp4", height: 1080 });
    expect(adaptQqMvStream(dto, 720)).toMatchObject({ url: "https://host/c.mp4", height: 720 });
    expect(adaptQqMvStream(dto, 100)).toMatchObject({ url: "https://host/a.mp4?x=1", height: 480 });
    expect(adaptQqMvStream(dto)?.qualities.map((quality) => quality.height)).toEqual([
      1080, 720, 480,
    ]);
  });

  it("has no stream when no file has a playable link", () => {
    expect(adaptQqMvStream({ code: 200, vid: "v", files: [] })).toBeNull();
  });
});
