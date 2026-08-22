import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const readSource = (relativePath: string) =>
  Bun.file(resolve(import.meta.dir, "..", relativePath)).text();

describe("landing page background", () => {
  test("mounts the real Folia Latent shader renderer", async () => {
    const [pageSource, rendererSource] = await Promise.all([
      readSource("app/page.tsx"),
      readSource("components/marketing/folia-latent-background.tsx"),
    ]);

    expect(pageSource).toContain("FoliaLatentBackground");
    expect(pageSource).not.toContain("FoliaFluidBackground");
    expect(rendererSource).toContain("MeshGradient");
    expect(rendererSource).toContain("Dithering");
    expect(rendererSource).toContain('shape="warp"');
  });
});
