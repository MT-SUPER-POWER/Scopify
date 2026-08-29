import { describe, expect, test } from "bun:test";
import {
  createPlaybackQueue,
  type PlaybackQueueItem,
  type PlaybackQueueSnapshot,
} from "../lib/player/playbackQueue";

interface Track extends PlaybackQueueItem {
  title: string;
}

const a: Track = { id: 1, title: "A" };
const aDuplicate: Track = { id: 1, title: "A duplicate" };
const b: Track = { id: 2, title: "B" };
const c: Track = { id: 3, title: "C" };
const d: Track = { id: 4, title: "D" };

const queue = createPlaybackQueue<Track>((tracks) => [...tracks].reverse());

function snapshot(
  overrides: Partial<PlaybackQueueSnapshot<Track>> = {},
): PlaybackQueueSnapshot<Track> {
  return {
    historyIndex: 0,
    historyStack: [0],
    isShuffle: false,
    originalQueue: [a, b, c],
    playlistId: null,
    queue: [a, b, c],
    queueIndex: 0,
    repeatMode: "off",
    ...overrides,
  };
}

describe("playback queue", () => {
  test("replays the current track only when an ended event meets repeat-one", () => {
    const repeatOne = snapshot({ repeatMode: "one" });

    const ended = queue.playNext(repeatOne, { currentTrack: a }, "ended");
    expect(ended.effect).toEqual({ track: a, type: "play" });
    expect(ended.snapshot.historyStack).toEqual([0]);
    expect(ended.snapshot.historyIndex).toBe(0);

    const manual = queue.playNext(repeatOne, { currentTrack: a }, "manual");
    expect(manual.effect).toEqual({ track: b, type: "play" });
    expect(manual.snapshot.queueIndex).toBe(1);
    expect(manual.snapshot.historyStack).toEqual([0, 1]);
  });

  test("uses forward history before calculating the next queue index", () => {
    const result = queue.playNext(
      snapshot({ historyIndex: 0, historyStack: [0, 2], queueIndex: 0 }),
      { currentTrack: a },
    );

    expect(result.effect).toEqual({ track: c, type: "play" });
    expect(result.snapshot.queueIndex).toBe(2);
    expect(result.snapshot.historyIndex).toBe(1);
    expect(result.snapshot.historyStack).toEqual([0, 2]);
  });

  test("stops on natural tail completion but restarts on a later manual next", () => {
    const tail = snapshot({ historyIndex: 2, historyStack: [0, 1, 2], queueIndex: 2 });

    const ended = queue.playNext(tail, { currentTrack: c }, "ended");
    expect(ended.effect).toEqual({ type: "stop" });
    expect(ended.snapshot).toEqual(tail);

    const manual = queue.playNext(tail, { currentTrack: c }, "manual");
    expect(manual.effect).toEqual({ track: a, type: "play" });
    expect(manual.snapshot.queueIndex).toBe(0);
    expect(manual.snapshot.historyStack).toEqual([0, 1, 2, 0]);
    expect(manual.snapshot.historyIndex).toBe(3);
  });

  test("wraps previous to the queue tail at the beginning of history", () => {
    const result = queue.playPrev(snapshot({ historyIndex: 0, historyStack: [0] }));

    expect(result.effect).toEqual({ track: c, type: "play" });
    expect(result.snapshot.queueIndex).toBe(2);
    expect(result.snapshot.historyStack).toEqual([2]);
    expect(result.snapshot.historyIndex).toBe(0);
  });

  test("rebuilds a shuffled repeat-all cycle before playing its first track", () => {
    const result = queue.playNext(
      snapshot({
        historyIndex: 2,
        historyStack: [0, 1, 2],
        isShuffle: true,
        queueIndex: 2,
        repeatMode: "all",
      }),
      { currentTrack: c },
    );

    expect(result.snapshot.queue).toEqual([c, b, a]);
    // reshuffle resets to [0], then playQueueIndex records the actual play.
    expect(result.snapshot.historyStack).toEqual([0, 0]);
    expect(result.snapshot.historyIndex).toBe(1);
    expect(result.effect).toEqual({ track: c, type: "play" });
  });

  test("keeps the caller startIndex when setQueue is already in shuffle mode", () => {
    const result = queue.setQueue(snapshot({ isShuffle: true }), [a, b, c], 0, "playlist-1");

    expect(result.snapshot.originalQueue).toEqual([a, b, c]);
    expect(result.snapshot.queue).toEqual([c, b, a]);
    expect(result.snapshot.queueIndex).toBe(0);
    expect(result.snapshot.historyStack).toEqual([0]);
    expect(result.snapshot.playlistId).toBe("playlist-1");
    expect(result.effect).toEqual({ type: "none" });
  });

  test("appends generated tracks without resetting the current index or history", () => {
    const result = queue.appendQueueItems(
      snapshot({ historyIndex: 1, historyStack: [0, 1], queueIndex: 1 }),
      [d],
    );

    expect(result.snapshot.queue).toEqual([a, b, c, d]);
    expect(result.snapshot.originalQueue).toEqual([a, b, c, d]);
    expect(result.snapshot.queueIndex).toBe(1);
    expect(result.snapshot.historyIndex).toBe(1);
    expect(result.snapshot.historyStack).toEqual([0, 1]);
    expect(result.effect).toEqual({ type: "none" });
  });

  test("puts the selected song first in shuffle playFromSong and removes equal ids", () => {
    const result = queue.playFromSong(snapshot({ isShuffle: true }), aDuplicate, [
      a,
      aDuplicate,
      b,
    ]);

    expect(result.snapshot.originalQueue).toEqual([a, aDuplicate, b]);
    expect(result.snapshot.queue).toEqual([aDuplicate, b]);
    expect(result.snapshot.queueIndex).toBe(0);
    expect(result.effect).toEqual({ track: aDuplicate, type: "play" });
  });

  test("resets history after moving a queue item and follows the loaded track", () => {
    const result = queue.moveQueueItem(snapshot({ queueIndex: 2 }), { currentTrack: c }, 0, 2);

    expect(result.snapshot.queue).toEqual([b, c, a]);
    expect(result.snapshot.originalQueue).toEqual([b, c, a]);
    expect(result.snapshot.queueIndex).toBe(1);
    expect(result.snapshot.historyStack).toEqual([1]);
    expect(result.snapshot.historyIndex).toBe(0);
  });

  test("resets history and loads the successor when the current queue entry is removed", () => {
    const result = queue.removeQueueItem(snapshot({ queueIndex: 1 }), { currentTrack: b }, 1);

    expect(result.snapshot.queue).toEqual([a, c]);
    expect(result.snapshot.originalQueue).toEqual([a, c]);
    expect(result.snapshot.queueIndex).toBe(1);
    expect(result.snapshot.historyStack).toEqual([1]);
    expect(result.effect).toEqual({ track: c, type: "play" });
  });

  test("treats an equal-id removal as removal of the loaded current track", () => {
    const result = queue.removeQueueItem(
      snapshot({ originalQueue: [a, aDuplicate, b], queue: [a, aDuplicate, b], queueIndex: 1 }),
      { currentTrack: a },
      0,
    );

    expect(result.snapshot.queue).toEqual([aDuplicate, b]);
    expect(result.snapshot.queueIndex).toBe(0);
    expect(result.effect).toEqual({ track: aDuplicate, type: "play" });
  });

  test("clears the queue through an explicit effect when its last item is removed", () => {
    const result = queue.removeQueueItem(
      snapshot({ originalQueue: [a], queue: [a], queueIndex: 0 }),
      { currentTrack: a },
      0,
    );

    expect(result.snapshot).toMatchObject({
      historyIndex: -1,
      historyStack: [],
      originalQueue: [],
      queue: [],
      queueIndex: -1,
    });
    expect(result.effect).toEqual({ type: "clear" });
  });
});
