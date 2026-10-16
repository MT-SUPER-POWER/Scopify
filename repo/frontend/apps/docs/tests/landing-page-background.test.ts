import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import {
  LANDING_DAY_MOMENTS,
  LANDING_LIVE_VISUALIZER,
  LANDING_VISUALIZER_MODES,
} from "@/constants/marketing";

const readSource = (relativePath: string) =>
  Bun.file(resolve(import.meta.dir, "..", relativePath)).text();

describe("landing page", () => {
  test("mounts the real Folia Latent shader and a live Sonnet stage", async () => {
    const [pageSource, heroSource, visualizersSource, rendererSource] = await Promise.all([
      readSource("app/page.tsx"),
      readSource("components/marketing/landing-hero.tsx"),
      readSource("components/marketing/landing-visualizers.tsx"),
      readSource("components/marketing/folia-latent-background.tsx"),
    ]);

    expect(pageSource).toContain("LandingExperience");
    expect(heroSource).toContain("FoliaLatentBackground");
    expect(visualizersSource).toContain("FoliaSonnetRenderer");
    expect(rendererSource).toContain("MeshGradient");
    expect(rendererSource).toContain("Dithering");
    expect(rendererSource).toContain('shape="warp"');
  });

  test("keeps the story data consistent", () => {
    expect(LANDING_DAY_MOMENTS).toHaveLength(6);
    expect(new Set(LANDING_VISUALIZER_MODES.map((mode) => mode.value)).size).toBe(
      LANDING_VISUALIZER_MODES.length,
    );
    expect(LANDING_VISUALIZER_MODES.some((mode) => mode.value === LANDING_LIVE_VISUALIZER)).toBe(
      true,
    );
  });
});
