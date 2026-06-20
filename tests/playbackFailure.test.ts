import { expect, test } from "bun:test";
import { getPlaybackFailureAction } from "@/lib/player/playbackFailure";

test("playback failure skips while the auto-skip budget remains", () => {
  expect(getPlaybackFailureAction(0, true)).toEqual({
    type: "skip",
    nextFailureCount: 1,
  });
});

test("playback failure stops after consecutive auto-skips reach the limit", () => {
  expect(getPlaybackFailureAction(2, true)).toEqual({
    type: "stop",
    nextFailureCount: 0,
  });
});

test("playback failure stops when there is no next track", () => {
  expect(getPlaybackFailureAction(0, false)).toEqual({
    type: "stop",
    nextFailureCount: 0,
  });
});
