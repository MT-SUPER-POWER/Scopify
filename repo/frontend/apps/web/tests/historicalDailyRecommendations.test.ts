import { afterEach, describe, expect, test } from "bun:test";

import {
  dislikeDailyRecommend,
  getHistoricalDailyRecommendationDetail,
  getHistoricalDailyRecommendations,
} from "@/lib/api/playlist";
import request from "@/lib/web/request";

const originalAdapter = request.defaults.adapter;

describe("historical daily recommendations", () => {
  afterEach(() => {
    request.defaults.adapter = originalAdapter;
  });

  test("keeps session credentials out of the calendar-date request parameters", async () => {
    let capturedParams: Record<string, unknown> | undefined;
    request.defaults.adapter = async (config) => {
      capturedParams = config.params as Record<string, unknown>;
      return {
        config,
        data: { code: 200, data: { dates: [] } },
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await getHistoricalDailyRecommendations();

    expect(capturedParams).not.toHaveProperty("cookie");
  });

  test("keeps only the selected date in authenticated business parameters", async () => {
    let capturedParams: Record<string, unknown> | undefined;
    request.defaults.adapter = async (config) => {
      capturedParams = config.params as Record<string, unknown>;
      return {
        config,
        data: { code: 200, data: { dailySongs: [] } },
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await getHistoricalDailyRecommendationDetail("2026-08-03");

    expect(capturedParams).toMatchObject({ date: "2026-08-03" });
    expect(capturedParams).not.toHaveProperty("cookie");
  });

  test("keeps session credentials out of authenticated daily actions", async () => {
    let capturedParams: Record<string, unknown> | undefined;
    request.defaults.adapter = async (config) => {
      capturedParams = config.params as Record<string, unknown>;
      return {
        config,
        data: { code: 200 },
        headers: {},
        status: 200,
        statusText: "OK",
      };
    };

    await dislikeDailyRecommend(123);

    expect(capturedParams).toMatchObject({ id: 123 });
    expect(capturedParams).not.toHaveProperty("cookie");
  });
});
