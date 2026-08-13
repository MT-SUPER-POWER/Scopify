import { describe, expect, test } from "bun:test";

import { isExternalPlaybackSourceCurrent } from "@/lib/player/externalPlaybackSource";

describe("isExternalPlaybackSourceCurrent", () => {
  const identity = { loadRevision: 7, sourceUrl: "https://cdn.example.test/next.mp3" };

  test("accepts a freshly projected Host source before React writes audio.src", () => {
    expect(
      isExternalPlaybackSourceCurrent(
        { currentSongUrl: identity.sourceUrl, playbackLoadRevision: identity.loadRevision },
        identity,
      ),
    ).toBe(true);
  });

  test("rejects a superseded Host source identity", () => {
    expect(
      isExternalPlaybackSourceCurrent(
        { currentSongUrl: identity.sourceUrl, playbackLoadRevision: identity.loadRevision + 1 },
        identity,
      ),
    ).toBe(false);
    expect(
      isExternalPlaybackSourceCurrent(
        {
          currentSongUrl: "https://cdn.example.test/other.mp3",
          playbackLoadRevision: identity.loadRevision,
        },
        identity,
      ),
    ).toBe(false);
  });
});
