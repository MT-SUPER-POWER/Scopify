import { describe, expect, test } from "bun:test";

import { resolveDailyRecommendationRequest } from "@/lib/playlist/dailyRecommendationRequest";

describe("daily recommendation request", () => {
  test("keeps today's recommendation distinct from historical-date requests", () => {
    expect(resolveDailyRecommendationRequest(null, new Date("2026-08-07T12:00:00.000Z"))).toEqual({
      cacheDate: "2026-08-07",
      dailyDate: null,
    });
  });

  test("uses an explicitly selected valid date for historical recommendations", () => {
    expect(
      resolveDailyRecommendationRequest("2026-08-03", new Date("2026-08-07T12:00:00.000Z")),
    ).toEqual({
      cacheDate: "2026-08-03",
      dailyDate: "2026-08-03",
    });
  });
});
