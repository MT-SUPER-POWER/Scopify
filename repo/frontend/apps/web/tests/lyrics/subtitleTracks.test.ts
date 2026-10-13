import { describe, expect, it } from "bun:test";
import { resolveVisualizerSubtitleOverlayContent } from "@/components/lyrics/folia/src/components/visualizer/VisualizerSubtitleOverlay";
import type { Line } from "@/components/lyrics/folia/src/types";
import {
  resolveLyricAlternateText,
  resolveLyricSubtitleTracks,
  resolveSingleTrackSubtitleMode,
} from "@/components/lyrics/folia/src/utils/lyrics/alternateText";

// 副字幕罗马音 + 翻译双行（Folia 871a7ba6）
const line = (extra: Partial<Line>): Line => ({
  fullText: "君の名は",
  startTime: 0,
  endTime: 2,
  words: [],
  ...extra,
});

describe("resolveLyricSubtitleTracks", () => {
  it("stacks romanization above translation under 'both'", () => {
    const tracks = resolveLyricSubtitleTracks(
      line({ romanization: "kimi no na wa", translation: "你的名字" }),
      "both",
    );
    expect(tracks).toEqual([
      { role: "romanization", text: "kimi no na wa" },
      { role: "translation", text: "你的名字" },
    ]);
  });

  it("drops a missing or unreadable row instead of leaving a placeholder", () => {
    expect(
      resolveLyricSubtitleTracks(line({ translation: "你的名字" }), "both").map((t) => t.role),
    ).toEqual(["translation"]);
    const readable = (text: string) => /[\p{L}\p{N}]/u.test(text);
    expect(
      resolveLyricSubtitleTracks(
        line({ romanization: "//", translation: "你的名字" }),
        "both",
        readable,
      ),
    ).toEqual([{ role: "translation", text: "你的名字" }]);
  });

  it("shows identical romanization and translation once", () => {
    expect(
      resolveLyricSubtitleTracks(line({ romanization: "hello", translation: "hello" }), "both"),
    ).toHaveLength(1);
  });

  it("falls back to alternateTexts and keeps single modes to one row", () => {
    const source = line({ alternateTexts: [{ role: "romanization", text: " ro " }] });
    expect(resolveLyricSubtitleTracks(source, "romanization")).toEqual([
      { role: "romanization", text: "ro" },
    ]);
    expect(resolveLyricSubtitleTracks(source, "none")).toEqual([]);
  });
});

describe("single-track consumers", () => {
  it("read translation under 'both'", () => {
    expect(resolveSingleTrackSubtitleMode("both")).toBe("translation");
    expect(resolveLyricAlternateText(line({ romanization: "r", translation: "t" }), "both")).toBe(
      "t",
    );
  });
});

describe("resolveVisualizerSubtitleOverlayContent", () => {
  it("uses the recently completed line when the active one has no rows", () => {
    const content = resolveVisualizerSubtitleOverlayContent({
      showText: true,
      activeLine: line({}),
      recentCompletedLine: line({ romanization: "r", translation: "t" }),
      nextLines: [],
      subtitleContentMode: "both",
    });
    expect(content.subtitleTracks.map((track) => track.text)).toEqual(["r", "t"]);
    expect(content.subtitleText).toBe("r / t");
    expect(content.upcomingLines).toEqual([]);
  });
});
