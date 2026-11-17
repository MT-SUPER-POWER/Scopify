import { describe, expect, it } from "bun:test";

import { buildCjkSemanticLayoutUnits } from "@/components/lyrics/folia/src/utils/lyrics/cjkSemanticLayout";

function timedWords(texts: string[]) {
  return texts.map((text, index) => ({ text, startTime: index, endTime: index + 0.5 }));
}

describe("CJK lyric layout", () => {
  it("groups timed characters even when a parser word carries trailing spaces", () => {
    const words = timedWords(["世", "界  ", "音", "乐"]);
    const units = buildCjkSemanticLayoutUnits({ fullText: "世界  音乐", words });

    expect(units.map((unit) => unit.text)).toEqual(["世界  ", "音乐"]);
    expect(units.flatMap((unit) => unit.words)).toEqual(words);
    expect(units[0]).toMatchObject({ isSemantic: true, startTime: 0, endTime: 1.5 });
  });

  it("keeps a standalone space with its surrounding display text", () => {
    const words = timedWords([" ", "世", "界", "  ", "音", "乐", " "]);
    const units = buildCjkSemanticLayoutUnits({ fullText: " 世界  音乐 ", words });

    expect(units.map((unit) => unit.text)).toEqual([" 世界  ", "音乐 "]);
    expect(units.flatMap((unit) => unit.words)).toEqual(words);
    expect(units[0]).toMatchObject({ isSemantic: true, startTime: 0, endTime: 3.5 });
    expect(units[1]).toMatchObject({ isSemantic: true, startTime: 4, endTime: 6.5 });
  });
});
