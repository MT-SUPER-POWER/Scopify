import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const readSource = (relativePath: string) =>
  Bun.file(resolve(import.meta.dir, "..", relativePath)).text();

describe("landing page background", () => {
  test("mounts the real Folia Latent shader renderer", async () => {
    const [pageSource, experienceSource, stageSource, rendererSource] = await Promise.all([
      readSource("app/page.tsx"),
      readSource("components/marketing/landing-experience.tsx"),
      readSource("components/marketing/landing-sonnet-stage.tsx"),
      readSource("components/marketing/folia-latent-background.tsx"),
    ]);

    expect(pageSource).toContain("LandingExperience");
    expect(experienceSource).toContain("LandingSonnetStage");
    expect(stageSource).toContain("FoliaLatentBackground");
    expect(`${pageSource}${experienceSource}${stageSource}`).not.toContain("FoliaFluidBackground");
    expect(rendererSource).toContain("MeshGradient");
    expect(rendererSource).toContain("Dithering");
    expect(rendererSource).toContain('shape="warp"');
  });
});
