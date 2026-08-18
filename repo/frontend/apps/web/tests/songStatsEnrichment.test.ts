import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  createSongStatsEnricher,
  type SongStatsFailure,
  type SongStatsLoader,
  type SongStatsResource,
} from "@/lib/song/enrichSongStatsCore";

type PlannedValue = number | "error";

interface RequestPlan {
  comment: PlannedValue[];
  liked: PlannedValue[];
}

const plans = new Map<number, RequestPlan>();
const voicePlans = new Map<number, { comment: number; liked: number }>();
const requestCounts = new Map<string, number>();

function nextPlannedValue(resource: SongStatsResource, type: "comment" | "liked"): PlannedValue {
  const key = `${resource.kind}:${resource.id}:${type}`;
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);

  if (resource.kind === "voice") {
    const plan = voicePlans.get(resource.id);
    if (!plan) throw new Error(`No ${type} plan for voice ${resource.id}`);
    return plan[type];
  }

  const plan = plans.get(resource.id);
  if (!plan) throw new Error(`No ${type} plan for song ${resource.id}`);
  const value = plan[type].shift();
  if (value === undefined) throw new Error(`No remaining ${type} response for song ${resource.id}`);
  return value;
}

function createLoader(): SongStatsLoader {
  const load = async (resource: SongStatsResource, type: "comment" | "liked") => {
    const value = nextPlannedValue(resource, type);
    if (value === "error") throw new Error(`${type} count unavailable`);
    return value;
  };

  return {
    getCommentCount: (resource) => load(resource, "comment"),
    getLikedCount: (resource) => load(resource, "liked"),
  };
}

function createEnricher(reportFailure = mock(() => undefined)) {
  return {
    enricher: createSongStatsEnricher({
      loader: createLoader(),
      propagateSongStats: () => undefined,
      reportFailure,
    }),
    reportFailure,
  };
}

function setPlan(songId: number, plan: RequestPlan) {
  plans.set(songId, { comment: [...plan.comment], liked: [...plan.liked] });
}

function setVoicePlan(voiceId: number, plan: { comment: number; liked: number }) {
  voicePlans.set(voiceId, { ...plan });
}

function countRequests(resource: SongStatsResource, type: "comment" | "liked") {
  return requestCounts.get(`${resource.kind}:${resource.id}:${type}`) ?? 0;
}

afterEach(() => {
  plans.clear();
  voicePlans.clear();
  requestCounts.clear();
});

describe("song stats enrichment", () => {
  test("deduplicates concurrent enrichment requests for the same song", async () => {
    setPlan(101, { comment: [22], liked: [11] });
    const { enricher } = createEnricher();

    const first = enricher.enrichSongStatsById(101);
    const second = enricher.enrichSongStatsById(101);

    expect(countRequests({ kind: "song", id: 101 }, "liked")).toBe(1);
    expect(countRequests({ kind: "song", id: 101 }, "comment")).toBe(1);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { stats: { commentCount: 22, likedCount: 11 }, status: "complete" },
      { stats: { commentCount: 22, likedCount: 11 }, status: "complete" },
    ]);
  });

  test("retries a failed statistic request before reporting success", async () => {
    setPlan(102, { comment: [44], liked: ["error", 33] });
    const { enricher } = createEnricher();

    await expect(enricher.enrichSongStatsById(102)).resolves.toEqual({
      stats: { commentCount: 44, likedCount: 33 },
      status: "complete",
    });

    expect(countRequests({ kind: "song", id: 102 }, "liked")).toBe(2);
    expect(countRequests({ kind: "song", id: 102 }, "comment")).toBe(1);
  });

  test("reports unavailable when neither statistic can be loaded after retrying", async () => {
    setPlan(103, { comment: ["error", "error"], liked: ["error", "error"] });
    const { enricher, reportFailure } = createEnricher();

    await expect(enricher.enrichSongStatsById(103)).resolves.toEqual({
      stats: {},
      status: "failed",
    });

    expect(countRequests({ kind: "song", id: 103 }, "liked")).toBe(2);
    expect(countRequests({ kind: "song", id: 103 }, "comment")).toBe(2);
    expect(reportFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { missingStats: ["likedCount", "commentCount"], songId: 103 },
        event: "song.stats_enrichment_failed",
      } satisfies Partial<SongStatsFailure>),
    );
  });

  test("loads voice comment and liked counts from the voice resource", async () => {
    setVoicePlan(9001, { comment: 65, liked: 191 });
    const { enricher } = createEnricher();

    await expect(enricher.enrichSongStatsById(104, undefined, 9001)).resolves.toEqual({
      stats: { commentCount: 65, likedCount: 191 },
      status: "complete",
    });

    expect(countRequests({ kind: "voice", id: 9001 }, "comment")).toBe(1);
    expect(countRequests({ kind: "voice", id: 9001 }, "liked")).toBe(1);
    expect(countRequests({ kind: "song", id: 104 }, "comment")).toBe(0);
    expect(countRequests({ kind: "song", id: 104 }, "liked")).toBe(0);
  });
});
