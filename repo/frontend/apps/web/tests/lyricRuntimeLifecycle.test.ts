import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  buildDioramaStructuredSurface,
  clearDioramaStructuredSurfaceCache,
  DIORAMA_SURFACE_CACHE_LIMIT,
  getDioramaStructuredSurfaceCacheSize,
} from "@/components/lyrics/folia/src/components/visualizer/diorama/dioramaParticleSurfaces";

function readWorkspaceFile(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("loads the main lyric stage only after the overlay is opened", () => {
  const mountSource = readWorkspaceFile("../components/lyrics/LyricStageMount.tsx");
  const uiStoreSource = readWorkspaceFile("../store/module/ui.ts");
  const partializeStart = uiStoreSource.indexOf("partialize:");
  const partializeEnd = uiStoreSource.indexOf("}),", partializeStart);

  expect(mountSource).toContain("const LyricStage = lazy");
  expect(mountSource).toContain('import("./LyricStage")');
  expect(mountSource).not.toContain('import { LyricStage } from "./LyricStage"');
  expect(partializeStart).toBeGreaterThan(-1);
  expect(uiStoreSource.slice(partializeStart, partializeEnd)).not.toContain("isLyricsOpen");
  expect(uiStoreSource).toContain("isLyricsOpen: false");
});

test("loads only the selected visualizer and background implementation", () => {
  const visualizerEntries = [
    "cadenza",
    "cappella",
    "claddagh",
    "classic",
    "diorama",
    "fume",
    "monet",
    "partita",
    "pendolo",
    "sonnet",
    "tilt",
  ];
  const backgroundEntries = ["common", "latent", "monet", "nomand", "sora", "url"];

  for (const mode of visualizerEntries) {
    const source = readWorkspaceFile(
      `../components/lyrics/folia/src/components/visualizer/${mode}/entry.tsx`,
    );
    expect(source).toContain("lazy(");
    expect(source).toContain("import(");
  }

  for (const mode of backgroundEntries) {
    const source = readWorkspaceFile(
      `../components/lyrics/folia/src/components/visualizer/backgrounds/${mode}/entry.tsx`,
    );
    expect(source).toContain("lazy(");
    expect(source).toContain("import(");
  }
});

test("stops the main visual surface while its full-quality settings preview owns the stage", () => {
  const stageSource = readWorkspaceFile("../components/lyrics/LyricStage.tsx");
  const settingsSource = readWorkspaceFile("../components/lyrics/FoliaStageSettings.tsx");

  expect(stageSource).toContain("isVisualSettingsOpen");
  expect(stageSource).toContain("isWindowVisible");
  expect(stageSource).toContain("!isVisualSettingsOpen && isWindowVisible");
  expect(settingsSource).toContain("onVisualSettingsOpenChange");
});

test("samples local audio features only while a lyric surface is subscribed", () => {
  const visualizerSource = readWorkspaceFile("../hooks/player/useAudioVisualizer.ts");
  const bridgeSource = readWorkspaceFile("../hooks/player/useFoliaPlaybackBridge.ts");

  expect(visualizerSource).toContain("subscribeLocalAudioFeatureDemand");
  expect(visualizerSource).not.toContain('new CustomEvent<LyricAudioBands>("player-audio-bands"');
  expect(bridgeSource).toContain("subscribeLocalAudioFeatures");
  expect(bridgeSource).not.toContain('addEventListener("player-audio-bands"');
});

test("bounds and clears generated Diorama surface caches", () => {
  const cacheSource = readWorkspaceFile(
    "../components/lyrics/folia/src/components/visualizer/diorama/dioramaParticleSurfaces.ts",
  );
  const visualizerSource = readWorkspaceFile(
    "../components/lyrics/folia/src/components/visualizer/diorama/VisualizerDiorama.tsx",
  );

  expect(cacheSource).toContain("DIORAMA_SURFACE_CACHE_LIMIT");
  expect(cacheSource).toContain("clearDioramaStructuredSurfaceCache");
  expect(visualizerSource).toContain("clearDioramaStructuredSurfaceCache");

  clearDioramaStructuredSurfaceCache();
  for (let index = 0; index < DIORAMA_SURFACE_CACHE_LIMIT + 5; index += 1) {
    buildDioramaStructuredSurface("box", 96 + index * 24, 1);
  }
  expect(getDioramaStructuredSurfaceCacheSize()).toBe(DIORAMA_SURFACE_CACHE_LIMIT);
  clearDioramaStructuredSurfaceCache();
  expect(getDioramaStructuredSurfaceCacheSize()).toBe(0);
});
