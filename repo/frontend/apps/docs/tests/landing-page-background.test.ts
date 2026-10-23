import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import {
  LANDING_BASE_COLOR,
  LANDING_CHAPTERS,
  LANDING_DAY_MOMENTS,
  LANDING_DEFAULT_VISUALIZER,
  LANDING_EQ_BANDS,
  LANDING_EQ_PRESETS,
  LANDING_VISUALIZER_MODES,
} from "@/constants/marketing";
import { buildEqArea, buildEqCurve } from "@scopify/ui/scopify/components/equalizer-curve";
import { paletteFromTheme, writePaletteRgb } from "@/lib/marketing/landing-palette";

const readSource = (relativePath: string) =>
  Bun.file(resolve(import.meta.dir, "..", relativePath)).text();

const commandShape = (path: string) => path.replace(/-?\d+(\.\d+)?/g, "#");

describe("landing page", () => {
  test("renders the hand-written sound field and the live Folia stage", async () => {
    const [pageSource, soundFieldSource, stageSource, shaderSource] = await Promise.all([
      readSource("app/page.tsx"),
      readSource("hooks/use-sound-field.ts"),
      readSource("components/marketing/landing-live-stage.tsx"),
      readSource("lib/marketing/sound-field-shader.ts"),
    ]);

    expect(pageSource).toContain("LandingExperience");
    expect(soundFieldSource).toContain("createSoundFieldRenderer");
    expect(stageSource).toContain("FoliaVisualizerRenderer");
    expect(stageSource).not.toContain("FoliaLatentBackground");
    expect(shaderSource).toContain("uSpotlight");
  });

  test("keeps the story data consistent", () => {
    const modes = new Set(LANDING_VISUALIZER_MODES.map((mode) => mode.value));
    expect(LANDING_DAY_MOMENTS).toHaveLength(6);
    expect(modes.size).toBe(LANDING_VISUALIZER_MODES.length);
    expect(modes.has(LANDING_DEFAULT_VISUALIZER)).toBe(true);
    expect(new Set(LANDING_CHAPTERS.map((chapter) => chapter.id)).size).toBe(
      LANDING_CHAPTERS.length,
    );
    expect(
      LANDING_EQ_PRESETS.every((preset) => preset.gains.length === LANDING_EQ_BANDS.length),
    ).toBe(true);
  });

  test("keeps every EQ curve morphable into every other", () => {
    const [first, ...rest] = LANDING_EQ_PRESETS.map((preset) => preset.gains);
    const curveShape = commandShape(buildEqCurve(first!, 12));
    const areaShape = commandShape(buildEqArea(first!, 12));
    for (const gains of rest) {
      expect(commandShape(buildEqCurve(gains, 12))).toBe(curveShape);
      expect(commandShape(buildEqArea(gains, 12))).toBe(areaShape);
    }
  });

  test("derives a sound field palette from a client theme", () => {
    const palette = paletteFromTheme("#E0CCAC", "#78685C");
    expect(palette[0]).toBe(LANDING_BASE_COLOR);
    expect(palette[3]).toBe("#E0CCAC");
    palette.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/i));

    const rgb = new Float32Array(12);
    writePaletteRgb(palette, rgb);
    expect(rgb[9]).toBeCloseTo(0xe0 / 255);
    expect(rgb[11]).toBeCloseTo(0xac / 255);
  });
});
