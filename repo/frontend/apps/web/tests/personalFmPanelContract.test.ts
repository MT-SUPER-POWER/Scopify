import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const stageSettingsSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/FoliaStageSettings.tsx", import.meta.url)),
  "utf8",
);
const controlsTabSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/FoliaPersonalFmControlsTab.tsx", import.meta.url)),
  "utf8",
);
const modeMatrixSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/FoliaPersonalFmModeMatrix.tsx", import.meta.url)),
  "utf8",
);
const dragScrollSource = readFileSync(
  fileURLToPath(new URL("../hooks/ui/useHorizontalDragScroll.ts", import.meta.url)),
  "utf8",
);
const playerControlsSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/FoliaPanelControls.tsx", import.meta.url)),
  "utf8",
);

test("Folia adds a grouped mode matrix without removing the queue tab", () => {
  expect(stageSettingsSource).toContain('["queue", ListMusic, "folia.queue.title"]');
  expect(stageSettingsSource).toContain('["fm", RadioTower, "personalFm.title"]');
  expect(stageSettingsSource).toContain('activeTab === "queue" ? <FoliaPanelQueue /> : null');
  expect(stageSettingsSource).toContain("<FoliaPersonalFmControlsTab");
  expect(controlsTabSource).toContain("<FoliaPersonalFmModeMatrix");
  expect(controlsTabSource).not.toContain("controls.previous");
  expect(controlsTabSource).not.toContain("controls.togglePlay");
  expect(controlsTabSource).not.toContain("controls.dislike");
  expect(modeMatrixSource).toContain('category === "genre"');
  expect(modeMatrixSource).toContain("grid-rows-2");
  expect(modeMatrixSource).toContain("horizontalScroll.scrollHandlers");
  expect(dragScrollSource).toContain("setPointerCapture");
  expect(dragScrollSource).toContain("scrollLeft = start.scrollLeft - offset");
  expect(dragScrollSource).toContain("row.scrollLeft += delta");
});

test("Folia puts Personal FM dislike in the first controls tab", () => {
  expect(playerControlsSource).toContain("model.isPersonalFm");
  expect(playerControlsSource).toContain("model.dislikePersonalFm");
  expect(playerControlsSource).toContain('t("personalFm.action.dislike")');
  expect(playerControlsSource).toContain("<Trash2");
  expect(playerControlsSource).toContain("<Shuffle");
});
