import { describe, expect, test } from "bun:test";

import {
  PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
  type PlaybackCheckpointV1,
  validatePlaybackCheckpoint,
} from "@scopifymusicplayer/desktop-contract/playbackCheckpoint";

function createCheckpoint(): PlaybackCheckpointV1 {
  return {
    protocolVersion: PLAYBACK_CHECKPOINT_PROTOCOL_VERSION,
    savedAtMs: 1_700_000_000_000,
    session: {
      intent: "pause",
      quality: "lossless",
      queue: {
        historyIndex: 0,
        historyStack: [0],
        originalQueue: [createEntry(1)],
        playlistId: 77,
        queue: [createEntry(1)],
        queueIndex: 0,
        repeatMode: "all",
        shuffleEnabled: false,
      },
      resumePositionMs: 15_000,
      revision: 5,
      volume: 0.65,
    },
  };
}

function createEntry(id: number) {
  return {
    album: { artworkUrl: "https://image.example/cover.jpg", id: 8, title: "Album" },
    artists: [{ id: 2, name: "Artist" }],
    durationMs: 180_000,
    fee: 0,
    id,
    publishTime: 1_700_000_000_000,
    title: "Track",
  };
}

describe("PlaybackCheckpoint contract", () => {
  test("accepts only the complete v1 session seed and save time", () => {
    const checkpoint = createCheckpoint();

    expect(validatePlaybackCheckpoint(checkpoint)).toEqual({ checkpoint, success: true });
  });

  test("rejects non-finite or unsafe save timestamps", () => {
    const nanTimestamp = { ...createCheckpoint(), savedAtMs: Number.NaN };
    expect(validatePlaybackCheckpoint(nanTimestamp).success).toBeFalse();

    const infiniteTimestamp = { ...createCheckpoint(), savedAtMs: Number.POSITIVE_INFINITY };
    expect(validatePlaybackCheckpoint(infiniteTimestamp).success).toBeFalse();

    const unsafeTimestamp = { ...createCheckpoint(), savedAtMs: Number.MAX_SAFE_INTEGER + 1 };
    expect(validatePlaybackCheckpoint(unsafeTimestamp).success).toBeFalse();
  });

  test("rejects unversioned, unknown, and disallowed recovery data", () => {
    const missingVersion = { ...createCheckpoint(), protocolVersion: 2 };
    expect(validatePlaybackCheckpoint(missingVersion).success).toBeFalse();

    const withSourceUrl = { ...createCheckpoint(), sourceUrl: "https://media.example/audio.mp3" };
    expect(validatePlaybackCheckpoint(withSourceUrl).success).toBeFalse();

    const withLyrics = { ...createCheckpoint(), lyrics: { url: "https://cdn.example/lyrics" } };
    expect(validatePlaybackCheckpoint(withLyrics).success).toBeFalse();
  });

  test("reuses strict session validation rather than accepting a partial queue", () => {
    const checkpoint = createCheckpoint();
    checkpoint.session.queue.historyStack = [];
    checkpoint.session.queue.historyIndex = -1;

    expect(validatePlaybackCheckpoint(checkpoint).success).toBeFalse();
  });
});
