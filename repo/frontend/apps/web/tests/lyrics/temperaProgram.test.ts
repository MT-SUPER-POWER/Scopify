import { describe, expect, it } from "bun:test";
import { compileTemperaProgram } from "@/components/lyrics/folia/src/components/visualizer/tempera/temperaProgram";
import type { Line } from "@/components/lyrics/folia/src/types";

// Tempera 整句模式测试，移植自 Folia d9e3efaa 的 temperaProgram 用例
const line = (
  fullText: string,
  startTime: number,
  endTime: number,
  words: Line["words"] = [{ text: fullText, startTime, endTime }],
): Line => ({ fullText, startTime, endTime, words });

const lyricShotsOf = (program: ReturnType<typeof compileTemperaProgram>) =>
  program.paragraphs.flatMap((paragraph) => paragraph.shots.filter((shot) => !shot.isBridge));

describe("Tempera whole-line lyrics", () => {
  it("keeps each complete lyric line in one shot when splitting is disabled", () => {
    const lines = [
      line("世界， 再见！", 0, 3.6, [
        { text: "世界", startTime: 0, endTime: 1.2 },
        { text: "再见", startTime: 1.8, endTime: 3.4 },
      ]),
      line("time time, again.", 4, 7.6, [
        { text: "time", startTime: 4, endTime: 4.8 },
        { text: "time", startTime: 5, endTime: 5.8 },
        { text: "again", startTime: 6.1, endTime: 7.4 },
      ]),
    ];
    const program = compileTemperaProgram(lines, "whole-lines", { wholeLineLyrics: true });
    const lyricShots = lyricShotsOf(program);

    expect(lyricShots).toHaveLength(lines.length);
    lyricShots.forEach((shot, index) => {
      expect(shot.slices).toHaveLength(1);
      const slice = shot.slices[0];
      const compiled = program.paragraphs
        .flatMap((paragraph) => paragraph.lines)
        .find((candidate) => candidate.sourceIndex === slice.lineIndex);
      expect(compiled).toBeDefined();
      expect(
        (compiled?.segments ?? [])
          .slice(slice.segmentStart, slice.segmentEnd)
          .map((segment) => segment.text)
          .join(""),
      ).toBe(lines[index].fullText);
      expect(shot.startTime).toBeGreaterThanOrEqual(lines[index].startTime);
      expect(shot.lyricEndTime).toBeLessThanOrEqual(lines[index].endTime);
    });
    expect(lyricShots[0].endTime).toBeCloseTo(lyricShots[1].startTime, 6);
  });

  it("still slices a long line into several shots by default", () => {
    const words = ["one", "two", "three", "four", "five", "six", "seven", "eight"].map(
      (text, index) => ({ text, startTime: index, endTime: index + 0.8 }),
    );
    const lines = [line(words.map((word) => word.text).join(" "), 0, 8, words)];
    expect(lyricShotsOf(compileTemperaProgram(lines, "sliced")).length).toBeGreaterThan(1);
    expect(
      lyricShotsOf(compileTemperaProgram(lines, "sliced", { wholeLineLyrics: true })),
    ).toHaveLength(1);
  });

  it("never draws decor from the glyphs its own shot is showing", () => {
    // Whole-line mode makes single-line paragraphs cover their whole line, so the decor pool
    // has to reach into the rest of the song instead of echoing the words on screen.
    const alphabets = ["aaaa bbbb", "cccc dddd", "eeee ffff", "gggg hhhh"];
    const lines = alphabets.map((text, index) =>
      line(text, index * 8, index * 8 + 3, [
        { text: text.split(" ")[0], startTime: index * 8, endTime: index * 8 + 1.4 },
        { text: text.split(" ")[1], startTime: index * 8 + 1.6, endTime: index * 8 + 3 },
      ]),
    );
    const lyricShots = lyricShotsOf(
      compileTemperaProgram(lines, "decor-pool", { wholeLineLyrics: true }),
    );

    expect(lyricShots).toHaveLength(lines.length);
    expect(lyricShots.some((shot) => shot.decor.fragments.length > 0)).toBe(true);
    lyricShots.forEach((shot, index) => {
      const own = new Set(Array.from(alphabets[index].replace(/\s/g, "")));
      shot.decor.fragments.forEach((fragment) => {
        expect(own.has(fragment.char)).toBe(false);
      });
      if (shot.decor.watermark) {
        expect(own.has(shot.decor.watermark.text[0])).toBe(false);
      }
    });
  });

  it("drops decor rather than echoing the only line in the song", () => {
    const lyricShots = lyricShotsOf(
      compileTemperaProgram([line("alone", 0, 2)], "decor-pool-empty", { wholeLineLyrics: true }),
    );

    expect(lyricShots.length).toBeGreaterThan(0);
    lyricShots.forEach((shot) => {
      expect(shot.decor.fragments).toEqual([]);
      expect(shot.decor.watermark).toBeNull();
    });
  });
});
