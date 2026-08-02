import { describe, expect, test } from "bun:test";

import type { Line } from "@/components/lyrics/folia/src/types";
import {
  buildSonnetSemanticSegments,
  compileSonnetProgram,
  findSonnetParagraphIndexAtTime,
  resolveSonnetParagraphGapThreshold,
} from "@/components/lyrics/folia/src/components/visualizer/sonnet/sonnetProgram";

const line = (
  fullText: string,
  startTime: number,
  endTime: number,
  words: Line["words"] = [{ text: fullText, startTime, endTime }],
  extra: Partial<Line> = {},
): Line => ({ fullText, startTime, endTime, words, ...extra });

describe("Sonnet program compiler", () => {
  test("preserves source text and parser timing for CJK and repeated Latin words", () => {
    const cjk = line("世界， 再见！", 1, 4, [
      { text: "世界", startTime: 1, endTime: 2 },
      { text: "再见", startTime: 2.5, endTime: 3.7 },
    ]);
    const latin = line("It's time, time.", 0, 3, [
      { text: "It's", startTime: 0, endTime: 0.8 },
      { text: "time", startTime: 1, endTime: 1.7 },
      { text: "time", startTime: 2, endTime: 2.7 },
    ]);

    const cjkSegments = buildSonnetSemanticSegments(cjk);
    const latinSegments = buildSonnetSemanticSegments(latin);
    expect(cjkSegments.map((segment) => segment.text).join("")).toBe(cjk.fullText);
    expect(cjkSegments.flatMap((segment) => segment.wordIndices)).toContain(0);
    expect(latinSegments.map((segment) => segment.text).join("")).toBe(latin.fullText);
    expect(latinSegments.filter((segment) => segment.text.includes("time"))).toHaveLength(2);
  });

  test("builds deterministic bounded paragraphs and supports direct seeks", () => {
    const lines = Array.from({ length: 8 }, (_, index) =>
      line(
        `lyric ${index}!`,
        index * 2,
        index * 2 + 1.2,
        undefined,
        index === 3 ? { isChorus: true } : {},
      ),
    );
    const first = compileSonnetProgram(lines, "stable-song");
    const second = compileSonnetProgram(lines, "stable-song");
    const shotKinds = first.paragraphs.flatMap((paragraph) =>
      paragraph.shots.map((shot) => shot.kind),
    );

    expect(first).toEqual(second);
    expect(first.paragraphs.every((paragraph) => paragraph.lines.length <= 6)).toBe(true);
    expect(first.paragraphs.some((paragraph) => paragraph.kind === "chorus")).toBe(true);
    shotKinds.slice(1).forEach((kind, index) => expect(kind).not.toBe(shotKinds[index]));
    const finalParagraph = first.paragraphs.at(-1);
    expect(finalParagraph).toBeDefined();
    if (finalParagraph) {
      expect(findSonnetParagraphIndexAtTime(first, finalParagraph.startTime)).toBe(
        first.paragraphs.length - 1,
      );
    }
  });

  test("respects metadata boundaries and holds the outgoing scene through lyric gaps", () => {
    const lines = [
      line("one", 0, 1, undefined, { blockIndex: 0 }),
      line("two", 1.2, 2.2, undefined, { blockIndex: 0 }),
      line("three", 5, 6, undefined, { blockIndex: 1 }),
    ];

    expect(resolveSonnetParagraphGapThreshold(lines)).toBeGreaterThanOrEqual(1.25);
    const program = compileSonnetProgram(lines, "gap-hold");
    expect(program.paragraphs).toHaveLength(2);
    expect(program.paragraphs[1].boundary).toBe("metadata");
    expect(program.paragraphs[0].transitionOut?.endTime).toBe(program.paragraphs[1].startTime);
    expect(program.paragraphs[0].transitionOut?.startTime).toBeGreaterThan(
      program.paragraphs[0].endTime,
    );
  });
});
