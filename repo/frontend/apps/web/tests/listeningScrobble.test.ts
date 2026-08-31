import { describe, expect, test } from "bun:test";

import {
  createListeningScrobbleRequest,
  getListeningScrobbleThreshold,
  getTrackedListeningDelta,
  toScrobbleSourceId,
} from "@/lib/player/listeningScrobble";

const session = {
  artist: "Example Artist",
  key: "1:100",
  songId: 100,
  sourceId: "200",
  title: "Example Song",
  totalSeconds: 240,
};

describe("listening scrobble", () => {
  test("requires half of short songs or 30 seconds of longer songs", () => {
    expect(getListeningScrobbleThreshold(20)).toBe(10);
    expect(getListeningScrobbleThreshold(240)).toBe(30);
  });

  test("does not count seek jumps as listened playback", () => {
    expect(getTrackedListeningDelta(10, 14)).toBe(4);
    expect(getTrackedListeningDelta(10, 90)).toBe(0);
    expect(getTrackedListeningDelta(90, 10)).toBe(0);
  });

  test("builds a desktop-compatible check-in request after the threshold", () => {
    expect(createListeningScrobbleRequest(session, 29)).toBeNull();
    expect(createListeningScrobbleRequest(session, 31)).toEqual({
      artist: "Example Artist",
      id: 100,
      level: "exhigh",
      name: "Example Song",
      source: "list",
      sourceid: "200",
      time: 31,
      total: 240,
    });
  });

  test("only sends a numeric playlist id as the source id", () => {
    expect(toScrobbleSourceId("123")).toBe("123");
    expect(toScrobbleSourceId("library:recent")).toBeUndefined();
  });
});
