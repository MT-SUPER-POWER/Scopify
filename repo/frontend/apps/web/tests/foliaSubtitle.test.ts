import { describe, expect, test } from "bun:test";

import { resolveVisualizerSubtitleOverlayContent } from "@/components/lyrics/folia/src/components/visualizer/VisualizerSubtitleOverlay";
import type { Line } from "@/components/lyrics/folia/src/types";
import {
  resolveLyricAlternateText,
  resolveSubtitleContentMode,
} from "@/components/lyrics/folia/src/utils/lyrics/alternateText";
import {
  createDefaultFoliaStageSettings,
  normalizeFoliaStageSettings,
} from "@/lib/lyrics/foliaStageSettings";

const line = (fullText: string, extra: Partial<Line> = {}): Line => ({
  endTime: 2,
  fullText,
  startTime: 1,
  words: [{ endTime: 2, startTime: 1, text: fullText }],
  ...extra,
});

describe("Folia subtitle content", () => {
  test("resolves direct and normalized alternate translation tracks", () => {
    const source = line("原文", {
      alternateTexts: [
        { role: "translation", text: "  fallback translation  " },
        { role: "romanization", text: "  yuan wen  " },
      ],
      translation: "  direct translation  ",
    });

    expect(resolveLyricAlternateText(source, "translation")).toBe("direct translation");
    expect(resolveLyricAlternateText(source, "romanization")).toBe("yuan wen");
    expect(resolveLyricAlternateText(source, "none")).toBeNull();
  });

  test("keeps the legacy translation switch as a fallback mode", () => {
    expect(resolveSubtitleContentMode(undefined, true)).toBe("translation");
    expect(resolveSubtitleContentMode(undefined, false)).toBe("none");
    expect(resolveSubtitleContentMode("romanization", false)).toBe("romanization");
  });

  test("renders romanization and falls back to upcoming lines when subtitle content is disabled", () => {
    const activeLine = line("原文", { romanization: "yuan wen", translation: "original" });
    const nextLine = line("下一句");

    expect(
      resolveVisualizerSubtitleOverlayContent({
        activeLine,
        nextLines: [line("//"), nextLine],
        recentCompletedLine: null,
        showText: true,
        subtitleContentMode: "romanization",
      }),
    ).toEqual({ shouldRenderOverlay: true, subtitleText: "yuan wen", upcomingLines: [] });

    expect(
      resolveVisualizerSubtitleOverlayContent({
        activeLine,
        nextLines: [line("//"), nextLine],
        recentCompletedLine: null,
        showText: true,
        subtitleContentMode: "none",
      }),
    ).toEqual({ shouldRenderOverlay: true, subtitleText: null, upcomingLines: [nextLine] });
  });
});

describe("Folia subtitle settings migration", () => {
  test("defaults to the new readable subtitle presentation", () => {
    const defaults = createDefaultFoliaStageSettings();

    expect(defaults).toMatchObject({
      showSubtitleTranslation: true,
      subtitleContentMode: "translation",
      subtitleFontScale: 1,
      subtitleOverlayBackground: true,
    });
  });

  test("migrates the legacy translation toggle to the equivalent content mode", () => {
    expect(
      normalizeFoliaStageSettings({ showSubtitleTranslation: false }).subtitleContentMode,
    ).toBe("none");
    expect(normalizeFoliaStageSettings({ showTranslation: true }).subtitleContentMode).toBe(
      "translation",
    );
  });

  test("validates explicit content modes and clamps subtitle scale", () => {
    expect(
      normalizeFoliaStageSettings({
        showSubtitleTranslation: false,
        subtitleContentMode: "romanization",
        subtitleFontScale: 9,
      }),
    ).toMatchObject({ subtitleContentMode: "romanization", subtitleFontScale: 1.4 });

    expect(
      normalizeFoliaStageSettings({
        subtitleContentMode: "unsupported",
        subtitleFontScale: 0,
      }),
    ).toMatchObject({ subtitleContentMode: "translation", subtitleFontScale: 0.85 });
  });
});
