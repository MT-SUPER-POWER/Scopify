import { describe, expect, test } from "bun:test";

import { shouldWarmPlaybackUrl } from "@/hooks/player/usePlaybackMediaSource";

describe("playback recovery ownership", () => {
  test("warms a restored song that has no persisted playback URL", () => {
    expect(
      shouldWarmPlaybackUrl({
        hasSong: true,
        hasSourceUrl: false,
        hasWarmed: false,
      }),
    ).toBeTrue();
  });

  test("does not warm an already loaded, absent, or previously restored browser source", () => {
    for (const input of [
      { hasSong: false, hasSourceUrl: false, hasWarmed: false },
      { hasSong: true, hasSourceUrl: true, hasWarmed: false },
      { hasSong: true, hasSourceUrl: false, hasWarmed: true },
    ]) {
      expect(shouldWarmPlaybackUrl(input)).toBeFalse();
    }
  });
});
