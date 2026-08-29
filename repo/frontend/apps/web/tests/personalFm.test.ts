import { describe, expect, test } from "bun:test";

import {
  DEFAULT_PERSONAL_FM_SELECTION,
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
  normalizePersonalFmSelection,
  PERSONAL_FM_PLAYBACK_SOURCE_ID,
} from "@/constants/personalFm";
import { getPersonalFmRemainingCount, selectNewPersonalFmQueueItems } from "@/lib/personalFm/queue";

describe("Personal FM selection", () => {
  test("keeps a valid scene mode and scene", () => {
    expect(normalizePersonalFmSelection({ mode: "SCENE_RCMD", scene: "FOCUS" })).toEqual({
      mode: "SCENE_RCMD",
      scene: "FOCUS",
    });
  });

  test("drops scenes from modes that cannot carry one", () => {
    expect(normalizePersonalFmSelection({ mode: "EXPLORE", scene: "FOCUS" })).toEqual({
      mode: "EXPLORE",
      scene: null,
    });
  });

  test("falls back when a scene mode has no supported scene", () => {
    expect(normalizePersonalFmSelection({ mode: "SCENE_RCMD", scene: "UNKNOWN" })).toEqual(
      DEFAULT_PERSONAL_FM_SELECTION,
    );
  });

  test("recognizes only the dedicated playback source", () => {
    expect(isPersonalFmPlaybackSource(PERSONAL_FM_PLAYBACK_SOURCE_ID)).toBe(true);
    expect(isPersonalFmPlaybackSource("daily")).toBe(false);
    expect(isPersonalFmPlaybackSource(null)).toBe(false);
  });

  test("includes the scene in the on-air mode label", () => {
    const labels: Record<string, string> = {
      "personalFm.mode.scene": "场景",
      "personalFm.scene.focus": "专注",
    };

    expect(
      getPersonalFmSelectionLabel(
        { mode: "SCENE_RCMD", scene: "FOCUS" },
        (key) => labels[key] ?? key,
      ),
    ).toBe("场景 · 专注");
  });
});

describe("Personal FM queue refill", () => {
  test("counts only tracks after the current item", () => {
    expect(getPersonalFmRemainingCount(3, 0)).toBe(2);
    expect(getPersonalFmRemainingCount(3, 2)).toBe(0);
    expect(getPersonalFmRemainingCount(0, -1)).toBe(0);
  });

  test("deduplicates incoming tracks against the queue and itself", () => {
    expect(
      selectNewPersonalFmQueueItems(
        [{ id: 1 }, { id: 2 }],
        [{ id: 2 }, { id: 3 }, { id: 3 }, { id: 4 }],
      ),
    ).toEqual([{ id: 3 }, { id: 4 }]);
  });
});
