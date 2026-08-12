import { describe, expect, mock, test } from "bun:test";

type PlannedValue = number | "error";

interface RequestPlan {
  comment: PlannedValue[];
  red: PlannedValue[];
}

const plans = new Map<number, RequestPlan>();
const requestCounts = new Map<string, number>();

function nextPlannedValue(songId: number, type: keyof RequestPlan): PlannedValue {
  const plan = plans.get(songId);
  if (!plan) throw new Error(`No ${type} plan for song ${songId}`);

  const key = `${songId}:${type}`;
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);

  const value = plan[type].shift();
  if (value === undefined) throw new Error(`No remaining ${type} response for song ${songId}`);
  return value;
}

const getSongRedCount = mock(async (songId: number) => {
  const value = nextPlannedValue(songId, "red");
  if (value === "error") throw new Error("red count unavailable");
  return { data: { code: 200, data: { count: value } } };
});

const getMusicComments = mock(async ({ id }: { id: number | string }) => {
  const songId = Number(id);
  const value = nextPlannedValue(songId, "comment");
  if (value === "error") throw new Error("comment count unavailable");
  return { data: { code: 200, total: value } };
});

const reportFailure = mock(() => undefined);

const playerState = {
  currentSongDetail: null,
  originalQueue: [],
  queue: [],
};

mock.module("@/lib/api/comment", () => ({ getMusicComments }));
mock.module("@/lib/api/track", () => ({ getSongRedCount }));
mock.module("@/lib/web/errorTracking", () => ({ reportFailure }));
mock.module("@/store", () => ({
  usePlayerStore: {
    getState: () => playerState,
    setState: (patch: Partial<typeof playerState>) => Object.assign(playerState, patch),
  },
  useUserStore: {
    getState: () => ({ mergeSongStats: () => undefined }),
  },
}));

const { enrichSongStatsById } = await import("@/lib/song/enrichSongStats");

function setPlan(songId: number, plan: RequestPlan) {
  reportFailure.mockClear();
  plans.set(songId, { comment: [...plan.comment], red: [...plan.red] });
}

function countRequests(songId: number, type: keyof RequestPlan) {
  return requestCounts.get(`${songId}:${type}`) ?? 0;
}

describe("song stats enrichment", () => {
  test("deduplicates concurrent enrichment requests for the same song", async () => {
    setPlan(101, { comment: [22], red: [11] });

    const first = enrichSongStatsById(101);
    const second = enrichSongStatsById(101);

    expect(countRequests(101, "red")).toBe(1);
    expect(countRequests(101, "comment")).toBe(1);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { stats: { commentCount: 22, likedCount: 11 }, status: "complete" },
      { stats: { commentCount: 22, likedCount: 11 }, status: "complete" },
    ]);
  });

  test("retries a failed statistic request before reporting success", async () => {
    setPlan(102, { comment: [44], red: ["error", 33] });

    await expect(enrichSongStatsById(102)).resolves.toEqual({
      stats: { commentCount: 44, likedCount: 33 },
      status: "complete",
    });

    expect(countRequests(102, "red")).toBe(2);
    expect(countRequests(102, "comment")).toBe(1);
  });

  test("reports unavailable when neither statistic can be loaded after retrying", async () => {
    setPlan(103, { comment: ["error", "error"], red: ["error", "error"] });

    await expect(enrichSongStatsById(103)).resolves.toEqual({
      stats: {},
      status: "failed",
    });

    expect(countRequests(103, "red")).toBe(2);
    expect(countRequests(103, "comment")).toBe(2);
    expect(reportFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { missingStats: ["likedCount", "commentCount"], songId: 103 },
        event: "song.stats_enrichment_failed",
      }),
    );
  });
});
