import { describe, expect, test } from "bun:test";

import {
  getCommentHref,
  normalizeLegacyComments,
  normalizeNewComments,
  resolveCommentResource,
} from "@/lib/comment/commentResource";

describe("comment resources", () => {
  test("keeps legacy song links and builds typed resource links", () => {
    expect(getCommentHref("song", 42)).toBe("/comment?songId=42");
    expect(getCommentHref("playlist", 7)).toBe("/comment?resource=playlist&id=7");
    expect(getCommentHref("voice", 9)).toBe("/comment?resource=voice&id=9");
    expect(getCommentHref("voice-list", 11)).toBe("/comment?resource=voice-list&id=11");
  });

  test("prefers a legacy song id and rejects unknown resource kinds", () => {
    expect(resolveCommentResource("playlist", "7", "42")).toEqual({
      id: "42",
      kind: "song",
      type: 0,
    });
    expect(resolveCommentResource("voice-list", "11", null)).toEqual({
      id: "11",
      kind: "voice-list",
      type: 7,
    });
    expect(resolveCommentResource("video", "11", null)).toBeNull();
  });

  test("normalizes legacy and new comment pagination shapes", () => {
    expect(
      normalizeLegacyComments({
        code: 200,
        comments: [],
        more: true,
        moreHot: false,
        total: 3,
      }),
    ).toEqual({ comments: [], cursor: undefined, hasMore: true, hotComments: [], total: 3 });

    expect(
      normalizeNewComments({
        code: 200,
        data: { comments: [], cursor: "next", hasMore: false, totalCount: 5 },
      }),
    ).toEqual({ comments: [], cursor: "next", hasMore: false, hotComments: [], total: 5 });
  });
});
