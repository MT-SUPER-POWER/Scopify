import { describe, expect, it } from "bun:test";
import type { Line as FoliaLine } from "@/components/lyrics/folia/src/types";
import { DEFAULT_LYRICS_PREVIEW } from "@/constants/appearance";
import {
  buildDynamicIslandContent,
  buildTaskbarLyricItems,
} from "@/lib/lyrics/companionLyricContent";
import {
  computeDesktopLyricWindowHeight,
  computeMarqueeOffset,
} from "@/lib/lyrics/desktopLyricLayout";
import { resolveTaskbarLyricTheme } from "@/lib/lyrics/taskbarLyricTheme";
import type { CompanionLyricSnapshot } from "@/types/desktop/companion";

const line = (fullText: string, startTime: number, translation?: string): FoliaLine => ({
  endTime: startTime + 3,
  fullText,
  startTime,
  translation,
  words: [],
});

const snapshot = (overrides: Partial<CompanionLyricSnapshot> = {}): CompanionLyricSnapshot => ({
  activeLine: null,
  index: -1,
  isInterlude: false,
  nextLine: null,
  track: { artistNames: ["Aimer", "Uru"], id: 1, title: "Song" },
  ...overrides,
});

describe("desktop lyric layout", () => {
  it("sizes the window from style settings, not from the current lyric", () => {
    const withTranslation = computeDesktopLyricWindowHeight({
      ...DEFAULT_LYRICS_PREVIEW,
      showTranslation: true,
    });
    const withoutTranslation = computeDesktopLyricWindowHeight({
      ...DEFAULT_LYRICS_PREVIEW,
      showTranslation: false,
    });
    expect(withTranslation).toBeGreaterThan(withoutTranslation);
    expect(
      computeDesktopLyricWindowHeight({
        ...DEFAULT_LYRICS_PREVIEW,
        fontSize: DEFAULT_LYRICS_PREVIEW.fontSize + 10,
      }),
    ).toBeGreaterThan(computeDesktopLyricWindowHeight(DEFAULT_LYRICS_PREVIEW));
  });

  it("holds an overflowing line before scrolling it to the end", () => {
    expect(computeMarqueeOffset(5_000, 5_000, 0)).toBe(0);
    expect(computeMarqueeOffset(500, 5_000, 120)).toBe(0);
    expect(computeMarqueeOffset(4_000, 5_000, 120)).toBe(-120);
    const midway = computeMarqueeOffset(2_000, 5_000, 120);
    expect(midway).toBeLessThan(0);
    expect(midway).toBeGreaterThan(-120);
  });
});

describe("companion lyric content", () => {
  it("shows the current line with its translation on the island", () => {
    const current = line("こんにちは", 1, "你好");
    const content = buildDynamicIslandContent(snapshot({ activeLine: current, index: 0 }), true);
    expect(content).toMatchObject({ main: "こんにちは", sub: "你好", progressLine: current });
  });

  it("keeps the island empty during interludes without progress or translation", () => {
    const content = buildDynamicIslandContent(
      snapshot({
        activeLine: line("......", 4, "translation"),
        isInterlude: true,
      }),
      true,
    );
    expect(content).toEqual({ key: "interlude", main: "", sub: "" });
    expect(buildDynamicIslandContent(snapshot({ isInterlude: true }), true)).toEqual(content);
  });

  it("does not treat empty or ellipsis placeholder lines as lyrics", () => {
    for (const text of ["", "  ", "...", "......", "…", "……", "⋯", " ... "]) {
      expect(
        buildDynamicIslandContent(snapshot({ activeLine: line(text, 4, "translation") }), true),
      ).toEqual({ key: "interlude", main: "", sub: "" });
    }
  });

  it("shows the next real lyric after an interlude and preserves punctuation in lyrics", () => {
    const current = line("等你...回来", 8, "come back");
    const content = buildDynamicIslandContent(snapshot({ activeLine: current, index: 2 }), true);
    expect(content).toEqual({
      key: "line-2-8",
      main: "等你...回来",
      sub: "come back",
      progressLine: current,
    });
    expect(buildDynamicIslandContent(snapshot(), true)).toMatchObject({
      main: "Song - Aimer / Uru",
      sub: "",
    });
  });

  it("prefers the translation for the taskbar's second line, then the next line", () => {
    const options = { doubleLine: true, showTranslation: true };
    const translated = buildTaskbarLyricItems(
      snapshot({ activeLine: line("a", 1, "甲"), index: 0, nextLine: line("b", 4) }),
      options,
    );
    expect(translated.map((item) => item.text)).toEqual(["a", "甲"]);

    const untranslated = buildTaskbarLyricItems(
      snapshot({ activeLine: line("a", 1), index: 0, nextLine: line("b", 4) }),
      options,
    );
    expect(untranslated.map((item) => [item.role, item.text])).toEqual([
      ["primary", "a"],
      ["secondary", "b"],
    ]);

    const single = buildTaskbarLyricItems(snapshot(), { ...options, doubleLine: false });
    expect(single.map((item) => item.text)).toEqual(["Song"]);
  });
});

describe("taskbar lyric theme", () => {
  it("uses dark text on light taskbars and follows the inverse mode", () => {
    expect(resolveTaskbarLyricTheme("taskbar", true).primary).toBe("#1a1a1a");
    expect(resolveTaskbarLyricTheme("taskbar", false).primary).toBe("#ffffff");
    expect(resolveTaskbarLyricTheme("taskbarInverse", true).primary).toBe("#ffffff");
    expect(resolveTaskbarLyricTheme("light", false).primary).toBe("#1a1a1a");
    expect(resolveTaskbarLyricTheme("dark", true).primary).toBe("#ffffff");
  });
});
