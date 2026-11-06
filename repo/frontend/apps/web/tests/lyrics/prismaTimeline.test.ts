import { describe, expect, it } from "bun:test";
import type { Line } from "@/components/lyrics/folia/src/types";
import { at } from "@/lib/lyrics/prisma/at";
import { buildPrismaBatch, PRISMA_BATCH_STRIDE } from "@/lib/lyrics/prisma/batch";
import {
  buildPrismaScript,
  findPrismaLineIndex,
  PRISMA_LAND_LEAD,
  PRISMA_FIREWORK,
  PRISMA_MOTION_COUNT,
  pickPrismaMotions,
} from "@/lib/lyrics/prisma/timeline";
import type { PrismaBatchEnd, PrismaLine } from "@/types/lyrics/prisma/model";

const line = (text: string, startTime: number, endTime: number): Line => {
  const chars = Array.from(text);
  const step = (endTime - startTime) / chars.length;
  return {
    fullText: text,
    startTime,
    endTime,
    words: chars.map((char, index) => ({
      text: char,
      startTime: startTime + index * step,
      endTime: startTime + (index + 1) * step,
    })),
  };
};

const endOf = (scripted: PrismaLine): PrismaBatchEnd => {
  const placed = scripted.glyphs.map((glyph, glyphIndex) => ({
    glyphIndex,
    char: glyph.char,
    x: glyphIndex * 50,
    y: 100,
    width: 50,
    height: 60,
    color: [255, 255, 255] as [number, number, number],
  }));
  return {
    line: scripted,
    layout: {
      font: "",
      fontPx: 48,
      glyphs: placed,
      bounds: { x: 0, y: 100, width: 50, height: 60 },
    },
    tiles: {
      count: placed.length,
      x: Float32Array.from(placed.map((glyph) => glyph.x)),
      y: Float32Array.from(placed.map((glyph) => glyph.y)),
      glyph: Uint16Array.from(placed.map((_, index) => index)),
      tileWidth: 7,
      tileHeight: 3,
    },
  };
};

describe("聚散 timeline", () => {
  it("lands every glyph just before it is sung", () => {
    const [first] = buildPrismaScript([line("一二三四", 10, 12)], null);
    for (const glyph of first?.glyphs ?? []) {
      expect(glyph.land).toBeCloseTo(glyph.start - PRISMA_LAND_LEAD);
    }
  });

  it("clears a line by the time the next one starts, unless a glyph is still being sung", () => {
    const [first] = buildPrismaScript([line("一二三四", 10, 12), line("五六七八", 12, 14)], null);
    for (const glyph of first?.glyphs ?? []) {
      expect(glyph.release).toBeLessThanOrEqual(Math.max(12, glyph.end + 0.06));
      expect(glyph.release).toBeGreaterThan(glyph.end);
    }
  });

  it("holds a line through a long gap only for a while", () => {
    const [first] = buildPrismaScript([line("一二三四", 10, 12), line("五六七八", 40, 42)], null);
    expect(first?.glyphs.at(-1)?.release).toBeLessThan(16);
  });

  it("adds the title only when the intro has time for it, and keeps it without lyrics", () => {
    expect(at(buildPrismaScript([line("一二", 1, 2)], "歌名"), 0).text).toBe("一二");
    expect(at(buildPrismaScript([line("一二", 10, 12)], "歌名"), 0).text).toBe("歌名");
    const [title] = buildPrismaScript([], "歌名");
    expect(title?.glyphs[0]?.release).toBe(Infinity);
  });

  it("finds the current line", () => {
    const script = buildPrismaScript([line("一", 10, 12), line("二", 12, 14)], null);
    expect(findPrismaLineIndex(script, 5)).toBe(-1);
    expect(findPrismaLineIndex(script, 10)).toBe(0);
    expect(findPrismaLineIndex(script, 13)).toBe(1);
  });
});

describe("聚散 flights", () => {
  const view = { width: 1000, height: 600 };

  it("gives a flight as many shards as its larger end, and lands no later than sung when there is room", () => {
    const script = buildPrismaScript([line("一二三四五六", 10, 12), line("七八九", 12, 14)], null);
    const batch = buildPrismaBatch(endOf(at(script, 0)), endOf(at(script, 1)), view, 7);
    expect(batch.count).toBe(6);
    expect(batch.buffer.byteLength).toBe(6 * PRISMA_BATCH_STRIDE);
    const floats = new Float32Array(batch.buffer);
    for (let index = 0; index < batch.count; index += 1) {
      const land = at(floats, index * (PRISMA_BATCH_STRIDE / 4) + 10);
      const release = at(floats, index * (PRISMA_BATCH_STRIDE / 4) + 9);
      expect(land - release).toBeGreaterThan(0.29);
    }
    expect(batch.to).toBeLessThanOrEqual(14);
  });

  it("flies out of and back into empty space at the ends of a song", () => {
    const script = buildPrismaScript([line("一二", 10, 12)], null);
    const entering = buildPrismaBatch(null, endOf(at(script, 0)), view, 1);
    const leaving = buildPrismaBatch(endOf(at(script, 0)), null, view, 2);
    expect(entering.count).toBe(2);
    expect(entering.from).toBeLessThan(10);
    expect(leaving.from).toBeGreaterThan(12);
  });
});

describe("pickPrismaMotions", () => {
  const script = buildPrismaScript(
    Array.from({ length: 120 }, (_, index) => line(`line${index}`, index * 4 + 5, index * 4 + 8)),
    null,
  );

  it("gives the same song the same motions, and another song others", () => {
    expect(pickPrismaMotions(script, "song-a")).toEqual(pickPrismaMotions(script, "song-a"));
    expect(pickPrismaMotions(script, "song-a")).not.toEqual(pickPrismaMotions(script, "song-b"));
  });

  it("covers every flight and every motion without an immediate repeat", () => {
    const motions = pickPrismaMotions(script, "song-a").map((entry) => entry.motion);
    expect(motions).toHaveLength(script.length + 1);
    expect(new Set(motions).size).toBe(PRISMA_MOTION_COUNT + 1);
    motions.forEach((motion, index) => {
      if (index > 0) expect(motion).not.toBe(at(motions, index - 1));
      if (index > 1) expect(motion).not.toBe(at(motions, index - 2));
    });
  });

  it("keeps chorus flights to the big motions", () => {
    const chorus = buildPrismaScript(
      Array.from({ length: 30 }, (_, index) => ({
        ...line(`line${index}`, index * 4 + 5, index * 4 + 8),
        isChorus: true,
      })),
      null,
    );
    pickPrismaMotions(chorus, "song-a").forEach(({ motion }) => {
      expect([0, 1, 5, PRISMA_FIREWORK]).toContain(motion);
    });
  });

  const fireworkFlights = (entries: Line[]) => {
    const flights = pickPrismaMotions(buildPrismaScript(entries, null), "song-a");
    return flights.flatMap((entry, index) => (entry.motion === PRISMA_FIREWORK ? [index] : []));
  };

  it("sets off a firework when the chorus comes in and after a long wait", () => {
    const verse = (index: number) => line(`v${index}`, index * 4 + 5, index * 4 + 8);
    const entering = [verse(0), verse(1), { ...line("chorus", 13, 16), isChorus: true }];
    expect(fireworkFlights(entering)).toEqual([2]);
    expect(fireworkFlights([verse(0), line("late", 20, 23)])).toEqual([1]);
  });

  it("follows the animation intensity", () => {
    const motionsAt = (intensity: "calm" | "normal" | "chaotic") =>
      pickPrismaMotions(script, "song-a", intensity).map((entry) => entry.motion);
    const fireworks = (motions: number[]) =>
      motions.filter((motion) => motion === PRISMA_FIREWORK).length;
    expect(pickPrismaMotions(script, "song-a")).toEqual(
      pickPrismaMotions(script, "song-a", "normal"),
    );
    expect(new Set(motionsAt("calm"))).toEqual(new Set([0, 3, 4, 6]));
    expect(fireworks(motionsAt("chaotic"))).toBeGreaterThan(fireworks(motionsAt("normal")));
  });

  it("keeps fireworks apart and off short lines", () => {
    const paused = Array.from({ length: 20 }, (_, index) =>
      line(`p${index}`, index * 10 + 5, index * 10 + 8),
    );
    fireworkFlights(paused).forEach((flight, index, all) => {
      if (index > 0) expect(flight - at(all, index - 1)).toBeGreaterThanOrEqual(6);
    });
    expect(fireworkFlights([line("a", 5, 8), line("b", 20, 20.5)])).toEqual([]);
  });
});
