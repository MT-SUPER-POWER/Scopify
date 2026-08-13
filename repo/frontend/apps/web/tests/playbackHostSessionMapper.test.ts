import { describe, expect, test } from "bun:test";
import {
  isPlaybackQueueEntry,
  isPlaybackSessionSeed,
  type PlaybackHostSessionSnapshot,
} from "@scopifymusicplayer/desktop-contract/playbackHostControl";

import {
  createInitialPlaybackSessionRevision,
  fromPlaybackQueueEntry,
  nextPlaybackSessionRevision,
  toPlaybackQueueEntry,
  toPlaybackSessionSeed,
  toPlayerSessionProjection,
  toPlayerSessionProjectionFromSnapshot,
} from "../lib/playbackHost/sessionMapper";
import type { SongDetail } from "../types/api/music";
import type { PlayerStore } from "../types/player";

const song: SongDetail = {
  al: {
    coverUrl: "album-cover-only",
    id: 8,
    name: "Album",
    picUrl: "artwork",
  },
  alia: ["Alternate title"],
  ar: [
    { id: 2, name: "First artist" },
    { id: 3, name: "Second artist" },
  ],
  dt: 210_000,
  fee: 1,
  id: 7,
  name: "Track",
  publishTime: 1_700_000_000_000,
  voiceId: 42,
};

function createPlayerState(
  overrides: Partial<
    Pick<
      PlayerStore,
      | "historyIndex"
      | "historyStack"
      | "isPlaying"
      | "isShuffle"
      | "musicQuality"
      | "originalQueue"
      | "playlistId"
      | "queue"
      | "queueIndex"
      | "repeatMode"
      | "volume"
    >
  > = {},
) {
  return {
    historyIndex: 1,
    historyStack: [0, 1],
    isPlaying: true,
    isShuffle: true,
    musicQuality: "lossless",
    originalQueue: [song, { ...song, id: 9, name: "Second track" }],
    playlistId: "playlist-7",
    queue: [{ ...song, id: 9, name: "Second track" }, song],
    queueIndex: 1,
    repeatMode: "all",
    volume: 45,
    ...overrides,
  } satisfies Pick<
    PlayerStore,
    | "historyIndex"
    | "historyStack"
    | "isPlaying"
    | "isShuffle"
    | "musicQuality"
    | "originalQueue"
    | "playlistId"
    | "queue"
    | "queueIndex"
    | "repeatMode"
    | "volume"
  >;
}

describe("Playback Host session mapper", () => {
  test("round-trips stable SongDetail fields, including voice tracks", () => {
    const entry = toPlaybackQueueEntry(song);

    expect(isPlaybackQueueEntry(entry)).toBe(true);
    expect(entry).toEqual({
      alias: ["Alternate title"],
      album: { artworkUrl: "artwork", id: 8, title: "Album" },
      artists: [
        { id: 2, name: "First artist" },
        { id: 3, name: "Second artist" },
      ],
      durationMs: 210_000,
      fee: 1,
      id: 7,
      publishTime: 1_700_000_000_000,
      title: "Track",
      voiceId: 42,
    });
    expect(fromPlaybackQueueEntry(entry)).toEqual({
      al: { id: 8, name: "Album", picUrl: "artwork" },
      alia: ["Alternate title"],
      ar: [
        { id: 2, name: "First artist" },
        { id: 3, name: "Second artist" },
      ],
      dt: 210_000,
      fee: 1,
      id: 7,
      name: "Track",
      publishTime: 1_700_000_000_000,
      voiceId: 42,
    });
  });

  test("maps a complete player queue session to a valid, URL-free host DTO", () => {
    const player = {
      ...createPlayerState(),
      currentSongUrl: "https://cdn.example.com/track.mp3",
      lyric: { lrc: { lyric: "must not cross the host boundary" } },
    };
    const session = toPlaybackSessionSeed(player, 12_345, 12);

    expect(isPlaybackSessionSeed(session)).toBe(true);
    expect(session).toMatchObject({
      intent: "play",
      quality: "lossless",
      queue: {
        historyIndex: 1,
        historyStack: [0, 1],
        playlistId: "playlist-7",
        queueIndex: 1,
        repeatMode: "all",
        shuffleEnabled: true,
      },
      resumePositionMs: 12_345,
      revision: 12,
      volume: 0.45,
    });
    expect(JSON.stringify(session)).not.toContain("https://cdn.example.com/track.mp3");
    expect(JSON.stringify(session)).not.toContain("cookie");
    expect(JSON.stringify(session)).not.toContain("lyric");
  });

  test("preserves history and maps a Host snapshot into an independent Main UI projection", () => {
    const session = toPlaybackSessionSeed(createPlayerState(), 12_345, 12);
    const snapshot: PlaybackHostSessionSnapshot = {
      protocolVersion: 1,
      session,
      type: "session-snapshot",
    };

    const projection = toPlayerSessionProjectionFromSnapshot(snapshot);

    expect(projection).toMatchObject({
      currentSongDetail: {
        al: { id: 8, name: "Album", picUrl: "artwork" },
        alia: ["Alternate title"],
        ar: [
          { id: 2, name: "First artist" },
          { id: 3, name: "Second artist" },
        ],
        dt: 210_000,
        fee: 1,
        id: 7,
        name: "Track",
        publishTime: 1_700_000_000_000,
        voiceId: 42,
      },
      historyIndex: 1,
      historyStack: [0, 1],
      isPlaying: true,
      isShuffle: true,
      musicQuality: "lossless",
      playbackSessionRevision: 12,
      playlistId: "playlist-7",
      queueIndex: 1,
      repeatMode: "all",
      resumePositionMs: 12_345,
      volume: 45,
    });
    expect(projection.currentSongDetail?.al).toEqual({ id: 8, name: "Album", picUrl: "artwork" });
    expect(projection.currentSongDetail?.ar).toEqual(song.ar);

    projection.queue[0].al.name = "Changed in projection";
    projection.historyStack.push(99);
    expect(session.queue.queue[0].album.title).toBe("Album");
    expect(session.queue.historyStack).toEqual([0, 1]);
  });

  test("does not share mutable entries or arrays with either direction", () => {
    const source = { ...song, alia: ["Source alias"], ar: [{ id: 2, name: "Source artist" }] };
    const entry = toPlaybackQueueEntry(source);
    const restored = fromPlaybackQueueEntry(entry);

    source.alia?.push("Source mutation");
    source.ar[0].name = "Source mutation";
    entry.album.title = "Entry mutation";
    entry.artists[0].name = "Entry mutation";

    expect(entry.alias).toEqual(["Source alias"]);
    expect(entry.artists[0].name).toBe("Entry mutation");
    expect(restored.al.name).toBe("Album");
    expect(restored.ar[0].name).toBe("Source artist");
  });

  test("represents an empty queue with the contract's empty indexes", () => {
    const session = toPlaybackSessionSeed(
      createPlayerState({
        historyIndex: -1,
        historyStack: [],
        originalQueue: [],
        queue: [],
        queueIndex: -1,
      }),
      0,
      0,
    );

    expect(isPlaybackSessionSeed(session)).toBe(true);
    expect(toPlayerSessionProjection(session)).toMatchObject({
      currentSongDetail: null,
      historyIndex: -1,
      historyStack: [],
      originalQueue: [],
      queue: [],
      queueIndex: -1,
    });
  });

  test("increments revisions without overflow or implicit reset", () => {
    expect(createInitialPlaybackSessionRevision()).toBe(0);
    expect(nextPlaybackSessionRevision(12)).toBe(13);
    expect(() => nextPlaybackSessionRevision(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => nextPlaybackSessionRevision(-1)).toThrow(TypeError);
    expect(() => nextPlaybackSessionRevision(1.5)).toThrow(TypeError);
  });
});
