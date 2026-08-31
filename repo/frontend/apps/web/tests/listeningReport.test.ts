import { describe, expect, test } from "bun:test";
import { getListeningDurationSeconds } from "@/lib/listeningReport/normalize";
import { getPlaylistTrackCount } from "@/types/api/playlist";

describe("listening report normalization", () => {
  test("reads duration fields from the report payload", () => {
    expect(getListeningDurationSeconds({ data: { totalTime: 3_661 } })).toBe(3_661);
    expect(getListeningDurationSeconds({ data: { listenTime: 8_400 } })).toBe(8_400);
  });

  test("converts millisecond duration payloads before display", () => {
    expect(getListeningDurationSeconds({ data: { duration: 3_600_000_000 } })).toBe(3_600_000);
  });
});

describe("recent playlist normalization", () => {
  test("uses alternate track count fields when recent-history records omit trackCount", () => {
    expect(getPlaylistTrackCount({ songCount: 12, trackCount: 0 })).toBe(12);
    expect(getPlaylistTrackCount({ trackIds: [{ id: 1 }, { id: 2 }] })).toBe(2);
  });
});
