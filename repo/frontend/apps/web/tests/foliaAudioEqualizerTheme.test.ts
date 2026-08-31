import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const equalizerPanelSource = readFileSync(
  fileURLToPath(new URL("../components/lyrics/FoliaAudioEqualizerPanel.tsx", import.meta.url)),
  "utf8",
);

test("Folia equalizer derives muted UI colors from its active theme", () => {
  expect(equalizerPanelSource).toContain("const mutedTextColor");
  expect(equalizerPanelSource).toContain("const sliderTrackColor");
  expect(equalizerPanelSource).toContain("style={{ color: primaryColor }}");
  expect(equalizerPanelSource).not.toContain("text-muted-foreground");
  expect(equalizerPanelSource).not.toContain("bg-border accent-primary");
});
