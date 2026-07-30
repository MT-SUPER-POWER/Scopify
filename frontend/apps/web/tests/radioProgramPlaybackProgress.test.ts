import { describe, expect, test } from "bun:test";

import { messages } from "@/lib/i18n";
import { getRadioProgramPlaybackProgress } from "@/lib/radio/programPlaybackProgress";

describe("radio program playback progress", () => {
  test("shows no progress when the program has no cloud listening record", () => {
    expect(getRadioProgramPlaybackProgress({ duration: 256_560 })).toEqual({ kind: "none" });
  });

  test("rounds a stored listening position to a whole percentage", () => {
    const progress = getRadioProgramPlaybackProgress({
      duration: 256_560,
      listenLocation: 161_000,
    });

    expect(progress).toEqual({ kind: "partial", percentage: 63 });
    expect(
      messages["zh-CN"]["library.podcasts.progress.partial"].replace("{{percentage}}", "63"),
    ).toBe("已播 63%");
  });

  test("marks a completed record as fully played even if its saved position is slightly short", () => {
    expect(
      getRadioProgramPlaybackProgress({
        duration: 256_560,
        isListened: true,
        listenLocation: 255_000,
      }),
    ).toEqual({ kind: "complete" });
    expect(messages["zh-CN"]["library.podcasts.progress.complete"]).toBe("已播完");
  });

  test("clamps an out-of-range saved position to completed", () => {
    expect(
      getRadioProgramPlaybackProgress({
        duration: 256_560,
        listenLocation: 300_000,
      }),
    ).toEqual({ kind: "complete" });
  });
});
