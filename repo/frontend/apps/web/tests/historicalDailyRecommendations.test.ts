import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  dislikeDailyRecommend,
  getHistoricalDailyRecommendationDetail,
  getHistoricalDailyRecommendations,
} from "@/lib/api/playlist";
import request from "@/lib/web/request";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
}

const originalAdapter = request.defaults.adapter;
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function restoreGlobal(
  name: "localStorage" | "window",
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
}

describe("historical daily recommendations", () => {
  beforeEach(() => {
    const storage = new MemoryStorage();
    storage.values.set("music_cookie", "MUSIC_U=vip-session; __csrf=csrf-token");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });
  });

  afterEach(() => {
    request.defaults.adapter = originalAdapter;
    restoreGlobal("localStorage", originalLocalStorage);
    restoreGlobal("window", originalWindow);
  });

  test("attaches the session credential to the calendar-date request", async () => {
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

    expect(capturedParams).toMatchObject({
      cookie: "MUSIC_U=vip-session; __csrf=csrf-token",
    });
  });

  test("attaches the session credential to a selected-date request", async () => {
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

    expect(capturedParams).toMatchObject({
      cookie: "MUSIC_U=vip-session; __csrf=csrf-token",
      date: "2026-08-03",
    });
  });

  test("attaches the session credential to authenticated daily actions", async () => {
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

    expect(capturedParams).toMatchObject({
      cookie: "MUSIC_U=vip-session; __csrf=csrf-token",
      id: 123,
    });
  });
});
