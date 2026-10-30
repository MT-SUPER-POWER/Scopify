import { describe, expect, it } from "bun:test";
import {
  DEFAULT_MACHI_TUNING,
  DEFAULT_NEBBIA_TUNING,
  MACHI_SCENE_IDS,
  MACHI_VIEW_LIMITS,
  NEBBIA_LIMITS,
} from "@/components/lyrics/folia/src/types";
import { resolveMachiSceneId } from "@/components/lyrics/folia/src/components/visualizer/machi/machiTuning";
import {
  createDefaultFoliaStageSettings,
  normalizeFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";

describe("町景 / 雾笺 stage settings", () => {
  it("ships both tunings in the default settings and accepts both modes", () => {
    const defaults = createDefaultFoliaStageSettings();
    expect(defaults.tunings.machi).toEqual(DEFAULT_MACHI_TUNING);
    expect(defaults.tunings.nebbia).toEqual(DEFAULT_NEBBIA_TUNING);
    expect(normalizeFoliaStageSettings({ mode: "machi" }).mode).toBe("machi");
    expect(normalizeFoliaStageSettings({ mode: "nebbia" }).mode).toBe("nebbia");
  });

  it("repairs stored Machi values field by field", () => {
    const stored = {
      tunings: {
        machi: {
          scene: "removed-scene",
          weather: "snow",
          aperture: 99,
          views: { konbini: { azimuth: 999, zoom: "far" } },
          quality: { renderScale: 3, glow: false },
        },
      },
    };
    const { machi } = normalizeFoliaStageSettings(stored).tunings;
    expect(machi?.scene).toBe("auto");
    expect(machi?.weather).toBe("snow");
    expect(machi?.aperture).toBe(16);
    expect(machi?.views.konbini.azimuth).toBe(MACHI_VIEW_LIMITS.azimuth.max);
    expect(machi?.views.konbini.zoom).toBe(1);
    expect(machi?.views.station).toEqual(DEFAULT_MACHI_TUNING.views.station);
    expect(machi?.quality.renderScale).toBe(DEFAULT_MACHI_TUNING.quality.renderScale);
    expect(machi?.quality.glow).toBe(false);
  });

  it("repairs stored Nebbia values and keeps at least one choice per group", () => {
    const stored = {
      tunings: {
        nebbia: {
          appear: ["breath", "unknown"],
          fade: [],
          layouts: "ribbon",
          credits: "yes",
          spot: 99,
          mist: -1,
        },
      },
    };
    const { nebbia } = normalizeFoliaStageSettings(stored).tunings;
    expect(nebbia?.appear).toEqual(["breath"]);
    expect(nebbia?.fade).toEqual(DEFAULT_NEBBIA_TUNING.fade);
    expect(nebbia?.layouts).toEqual(DEFAULT_NEBBIA_TUNING.layouts);
    expect(nebbia?.credits).toBe(DEFAULT_NEBBIA_TUNING.credits);
    expect(nebbia?.spot).toBe(NEBBIA_LIMITS.spot.max);
    expect(nebbia?.mist).toBe(NEBBIA_LIMITS.mist.min);
  });

  it("picks the same Machi scene for the same song", () => {
    const tuning = { scene: "auto" as const };
    expect(resolveMachiSceneId(tuning, "song-1")).toBe(resolveMachiSceneId(tuning, "song-1"));
    expect(MACHI_SCENE_IDS).toContain(resolveMachiSceneId(tuning, "song-2"));
    expect(resolveMachiSceneId({ scene: "kowloon" }, "song-1")).toBe("kowloon");
  });
});
