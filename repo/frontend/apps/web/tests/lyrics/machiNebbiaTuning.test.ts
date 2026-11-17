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

  it("keeps all Nebbia street layers off when the stored scenery is empty", () => {
    const { nebbia } = normalizeFoliaStageSettings({
      tunings: { nebbia: { behind: "backdrop", scenery: [], rain: "straight" } },
    }).tunings;
    expect(nebbia?.behind).toBe("backdrop");
    expect(nebbia?.scenery).toEqual([]);
    expect(nebbia?.rain).toBe("straight");
  });

  it("migrates a saved Nebbia resolution before using the current render fallback", () => {
    const current = createDefaultFoliaStageSettings();
    current.tunings.nebbia = {
      ...DEFAULT_NEBBIA_TUNING,
      render: { scale: 0.5, antialias: "global" },
    };
    const { nebbia } = normalizeFoliaStageSettings(
      { tunings: { nebbia: { behind: "aquarium", resolution: 1.25 } } },
      current,
    ).tunings;
    expect(nebbia?.render.scale).toBe(1.5);
    expect(nebbia?.glass).toBe("dew");
  });

  it("keeps the saved glass and render override when normalizing Nebbia options", () => {
    const { nebbia } = normalizeFoliaStageSettings({
      tunings: {
        nebbia: { behind: "aquarium", glass: "rain", resolution: 2, render: { scale: 0.75 } },
      },
    }).tunings;
    expect(nebbia?.glass).toBe("rain");
    expect(nebbia?.render.scale).toBe(0.75);
  });

  it("picks the same Machi scene for the same song", () => {
    const tuning = { scene: "auto" as const };
    expect(resolveMachiSceneId(tuning, "song-1")).toBe(resolveMachiSceneId(tuning, "song-1"));
    expect(MACHI_SCENE_IDS).toContain(resolveMachiSceneId(tuning, "song-2"));
    expect(resolveMachiSceneId({ scene: "kowloon" }, "song-1")).toBe("kowloon");
  });
});
