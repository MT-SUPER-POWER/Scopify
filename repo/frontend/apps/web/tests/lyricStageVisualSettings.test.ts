import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const lyricStageSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/LyricStage.tsx", import.meta.url)),
  "utf8",
);

test("Folia keeps the presentation mounted behind visual settings", () => {
  expect(lyricStageSource).toContain(
    "const isMainSurfaceActive = !isVisualSettingsOpen && isWindowVisible;",
  );
  expect(lyricStageSource).toContain("{isWindowVisible ? (");
  expect(lyricStageSource).not.toContain("{!isVisualSettingsOpen && isWindowVisible ? (");
});
