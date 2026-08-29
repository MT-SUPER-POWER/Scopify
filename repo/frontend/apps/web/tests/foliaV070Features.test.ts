import { expect, test } from "bun:test";

import { VISUALIZER_REGISTRY } from "@/components/lyrics/folia/src/components/visualizer/registry";
import { resolveTemperaImagePlacement } from "@/components/lyrics/folia/src/components/visualizer/tempera/temperaImageLayer";
import { compileTemperaProgram } from "@/components/lyrics/folia/src/components/visualizer/tempera/temperaProgram";
import { getVisualizerTuningModes } from "@/components/lyrics/folia/src/components/visualizer/tuningRegistry";
import { shouldDrawSonnetSceneBackdrop } from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetSceneBuilder";
import { setPixiDisplayTreeVisibility } from "@/components/lyrics/folia/src/components/visualizer/pixiDisplayResources";
import type { Line } from "@/components/lyrics/folia/src/types";
import {
  createDefaultFoliaStageSettings,
  normalizeFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";

test("registers Still and Tempera with Tempera tuning persistence", () => {
  expect(VISUALIZER_REGISTRY.map((entry) => entry.mode)).toContain("still");
  expect(VISUALIZER_REGISTRY.map((entry) => entry.mode)).toContain("tempera");
  expect(getVisualizerTuningModes()).toContain("tempera");
  expect(createDefaultFoliaStageSettings().tunings.tempera).toMatchObject({
    colorMode: "duo",
    layerImages: [],
    textureResolution: 1.5,
  });
});

test("normalizes untrusted Tempera settings and image descriptors", () => {
  const normalized = normalizeFoliaStageSettings({
    mode: "tempera",
    tunings: {
      tempera: {
        ...createDefaultFoliaStageSettings().tunings.tempera,
        cameraIntensity: 99,
        colorMode: "invalid",
        layerImages: [
          {
            align: "invalid",
            id: "image-1",
            name: "Character",
            opacity: 3,
            scale: -1,
            verticalAlign: "invalid",
          },
          { id: 3 },
        ],
      },
    },
  });

  expect(normalized.mode).toBe("tempera");
  expect(normalized.tunings.tempera).toMatchObject({
    cameraIntensity: 2,
    colorMode: "duo",
    layerImages: [
      {
        align: "free",
        id: "image-1",
        name: "Character",
        opacity: 1,
        scale: 0.15,
        verticalAlign: "bottom",
      },
    ],
  });
});

test("compiles a deterministic Tempera program and honors image alignment bands", () => {
  const lines: Line[] = [
    {
      endTime: 3,
      fullText: "让声音显形",
      startTime: 1,
      words: [
        { endTime: 1.5, startTime: 1, text: "让" },
        { endTime: 2, startTime: 1.5, text: "声音" },
        { endTime: 3, startTime: 2, text: "显形" },
      ],
    },
    {
      endTime: 6,
      fullText: "凝彩流动",
      startTime: 4,
      words: [{ endTime: 6, startTime: 4, text: "凝彩流动" }],
    },
  ];

  expect(compileTemperaProgram(lines, "song-1")).toEqual(compileTemperaProgram(lines, "song-1"));
  expect(compileTemperaProgram(lines, "song-1").paragraphs.length).toBeGreaterThan(0);

  const placement = resolveTemperaImagePlacement(
    {
      align: "left",
      id: "image",
      name: "Image",
      opacity: 0.8,
      scale: 0.7,
      verticalAlign: "top",
    },
    42,
  );
  expect(placement.x).toBeGreaterThanOrEqual(0.14);
  expect(placement.x).toBeLessThanOrEqual(0.32);
  expect(placement.y).toBeGreaterThanOrEqual(0.14);
  expect(placement.y).toBeLessThanOrEqual(0.32);
});

test("keeps transparent Sonnet surfaces clear and unloads hidden Pixi trees", () => {
  expect(shouldDrawSonnetSceneBackdrop(true, true)).toBe(false);
  expect(shouldDrawSonnetSceneBackdrop(true, false)).toBe(true);

  let unloaded = 0;
  const root = { visible: true, children: [{ unload: () => unloaded++ }] };
  setPixiDisplayTreeVisibility(root, false);
  setPixiDisplayTreeVisibility(root, false);
  expect(unloaded).toBe(1);
});
