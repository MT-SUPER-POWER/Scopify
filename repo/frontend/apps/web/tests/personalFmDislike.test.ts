import { describe, expect, test } from "bun:test";

import { dislikePersonalFmTrack } from "@/lib/personalFm/dislike";
import type { SongDetail } from "@/types/api/music";

const SONGS: SongDetail[] = [
  {
    al: { id: 11, name: "Album one", picUrl: "" },
    ar: [{ id: 101, name: "Artist one" }],
    dt: 180_000,
    fee: 0,
    id: 1,
    name: "Song one",
    publishTime: 0,
  },
  {
    al: { id: 12, name: "Album two", picUrl: "" },
    ar: [{ id: 102, name: "Artist two" }],
    dt: 181_000,
    fee: 0,
    id: 2,
    name: "Song two",
    publishTime: 0,
  },
];

describe("Personal FM dislike", () => {
  test("after successfully disliking the current track, advances only through Personal FM", async () => {
    const calls: string[] = [];

    const result = await dislikePersonalFmTrack(SONGS[0], {
      advance: async (source) => {
        calls.push(`advance:${source}`);
      },
      getPlayer: () => ({
        queue: SONGS,
        queueIndex: 0,
        removeQueueItem: (index) => calls.push(`remove:${index}`),
      }),
      trash: async (songId) => {
        calls.push(`trash:${songId}`);
      },
    });

    expect(result).toEqual({ status: "advanced" });
    expect(calls).toEqual(["trash:1", "advance:personal-fm-dislike"]);
  });

  test("after successfully disliking a non-current track, removes only that queue item", async () => {
    const calls: string[] = [];

    const result = await dislikePersonalFmTrack(SONGS[1], {
      advance: async (source) => {
        calls.push(`advance:${source}`);
      },
      getPlayer: () => ({
        queue: SONGS,
        queueIndex: 0,
        removeQueueItem: (index) => calls.push(`remove:${index}`),
      }),
      trash: async (songId) => {
        calls.push(`trash:${songId}`);
      },
    });

    expect(result).toEqual({ status: "removed" });
    expect(calls).toEqual(["trash:2", "remove:1"]);
  });

  test("leaves the queue untouched when the server rejects the dislike", async () => {
    const calls: string[] = [];

    await expect(
      dislikePersonalFmTrack(SONGS[1], {
        advance: async (source) => {
          calls.push(`advance:${source}`);
        },
        getPlayer: () => ({
          queue: SONGS,
          queueIndex: 0,
          removeQueueItem: (index) => calls.push(`remove:${index}`),
        }),
        trash: async (songId) => {
          calls.push(`trash:${songId}`);
          throw new Error("The server did not accept the dislike");
        },
      }),
    ).rejects.toThrow("The server did not accept the dislike");

    expect(calls).toEqual(["trash:2"]);
  });

  test("decides the queue action from fresh state after the server accepts", async () => {
    const calls: string[] = [];
    let serverAccepted = false;

    const result = await dislikePersonalFmTrack(SONGS[1], {
      advance: async (source) => {
        calls.push(`advance:${source}`);
      },
      getPlayer: () => {
        calls.push(`read:${serverAccepted}`);
        return {
          queue: SONGS,
          // The user moved to this song while the request was in flight.
          queueIndex: 1,
          removeQueueItem: (index) => calls.push(`remove:${index}`),
        };
      },
      trash: async () => {
        calls.push("trash");
        serverAccepted = true;
      },
    });

    expect(result).toEqual({ status: "advanced" });
    expect(calls).toEqual(["trash", "read:true", "advance:personal-fm-dislike"]);
  });

  test("removes the selected duplicate placement instead of advancing the current copy", async () => {
    const calls: string[] = [];
    const duplicate = { ...SONGS[0] };
    const queue = [SONGS[0], duplicate];

    const result = await dislikePersonalFmTrack(duplicate, {
      advance: async (source) => {
        calls.push(`advance:${source}`);
      },
      getPlayer: () => ({
        queue,
        queueIndex: 0,
        removeQueueItem: (index) => calls.push(`remove:${index}`),
      }),
      trash: async () => {
        calls.push("trash");
      },
    });

    expect(result).toEqual({ status: "removed" });
    expect(calls).toEqual(["trash", "remove:1"]);
  });

  test("advances when ReplayGain enrichment cloned the current queue item", async () => {
    const calls: string[] = [];
    const enrichedCurrent = { ...SONGS[0], replayGain: -4.5 };

    const result = await dislikePersonalFmTrack(enrichedCurrent, {
      advance: async (source) => {
        calls.push(`advance:${source}`);
      },
      getPlayer: () => ({
        queue: SONGS,
        queueIndex: 0,
        removeQueueItem: (index) => calls.push(`remove:${index}`),
      }),
      trash: async () => {
        calls.push("trash");
      },
    });

    expect(result).toEqual({ status: "advanced" });
    expect(calls).toEqual(["trash", "advance:personal-fm-dislike"]);
  });
});
