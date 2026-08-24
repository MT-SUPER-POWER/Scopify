import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const readSource = (relativePath: string) =>
  Bun.file(resolve(import.meta.dir, "..", relativePath)).text();

describe("landing page background", () => {
  test("mounts the real Folia Latent shader renderer", async () => {
    const [pageSource, experienceSource, introSource, stageSource, rendererSource, partitaSource] =
      await Promise.all([
        readSource("app/page.tsx"),
        readSource("components/marketing/landing-experience.tsx"),
        readSource("components/marketing/landing-intro.tsx"),
        readSource("components/marketing/landing-sonnet-stage.tsx"),
        readSource("components/marketing/folia-latent-background.tsx"),
        readSource("components/marketing/folia-partita-renderer.tsx"),
      ]);

    expect(pageSource).toContain("LandingExperience");
    expect(experienceSource).toContain("LandingSonnetStage");
    expect(stageSource).toContain("FoliaLatentBackground");
    expect(stageSource).toContain("FoliaPartitaRenderer");
    expect(stageSource).toContain("useLandingPartitaTimeline");
    expect(stageSource).toContain("opacity: isIntro ? 0.96 : 0");
    expect(stageSource).not.toContain("AnimatePresence");
    expect(introSource).toContain('<h1 className="sr-only">让声音，显形。</h1>');
    expect(introSource).not.toContain("landing-display");
    expect(partitaSource).toContain("@folia/components/visualizer/partita/VisualizerPartita");
    expect(`${pageSource}${experienceSource}${stageSource}`).not.toContain("FoliaFluidBackground");
    expect(rendererSource).toContain("MeshGradient");
    expect(rendererSource).toContain("Dithering");
    expect(rendererSource).toContain('shape="warp"');
  });
});
