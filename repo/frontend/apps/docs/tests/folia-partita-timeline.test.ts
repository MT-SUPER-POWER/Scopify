import { describe, expect, test } from "bun:test";

import { LANDING_PARTITA_ANIMATION_DURATION, LANDING_PARTITA_SLOGAN } from "@/constants/marketing";
import {
  LANDING_PARTITA_LINES,
  resolvePartitaIntroTime,
} from "@/lib/marketing/folia-partita-timeline";

describe("landing Partita intro timeline", () => {
  test("renders the landing slogan as the only lyric line", () => {
    expect(LANDING_PARTITA_LINES).toHaveLength(1);
    expect(LANDING_PARTITA_LINES[0]?.fullText).toBe(LANDING_PARTITA_SLOGAN);
  });

  test("reveals slogan graphemes in order", () => {
    const words = LANDING_PARTITA_LINES[0]?.words ?? [];

    expect(words.map((word) => word.text).join("")).toBe(LANDING_PARTITA_SLOGAN);
    expect(
      words.every((word, index) => index === 0 || word.startTime > words[index - 1]!.startTime),
    ).toBeTrue();
  });

  test("clamps at the final frame instead of looping", () => {
    expect(resolvePartitaIntroTime(-1)).toBe(0);
    expect(resolvePartitaIntroTime(1.5)).toBe(1.5);
    expect(resolvePartitaIntroTime(30)).toBe(LANDING_PARTITA_ANIMATION_DURATION);
  });
});
