import type { Line } from "@/components/lyrics/folia/src/types";
import {
  buildLineGraphemeTimeline,
  splitLyricGraphemes,
} from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import { getLineRenderEndTime } from "@/components/lyrics/folia/src/utils/lyrics/renderHints";
import type {
  PrismaGlyph,
  PrismaIntensity,
  PrismaLine,
  PrismaMotion,
} from "@/types/lyrics/prisma/model";
import { at } from "./at";

// lib/lyrics/prisma/timeline.ts
// When each glyph lands and leaves. A glyph lands just before it is sung. A line leaves in a wave across
// its text, starting shortly before the next line, so old text is gone when new text starts landing.

/** A glyph is whole this long before it is sung. */
export const PRISMA_LAND_LEAD = 0.06;
/** A sung glyph holds at least this long. */
const MIN_HOLD = 0.06;
/** With nothing following soon, a finished line stays this long before it leaves. */
const LINGER = 2.5;
const WAVE_MIN = 0.35;
const WAVE_MAX = 0.9;
/** The title only appears when the intro leaves this much time for it. */
const TITLE_MIN_INTRO = 4;
const TITLE_LAND_START = 0.25;
const TITLE_LAND_STEP = 0.05;

/** Sets when each glyph of `line` leaves, given when the next line starts (null: it is the last). */
export const scheduleRelease = (line: PrismaLine, nextStart: number | null) => {
  const count = line.glyphs.length;
  const wave = Math.min(WAVE_MAX, Math.max(WAVE_MIN, (line.end - line.start) * 0.35));
  const lingered = line.end + LINGER + wave;
  const leaveBy = nextStart === null ? lingered : Math.min(nextStart - 0.02, lingered);
  line.glyphs.forEach((glyph, index) => {
    const across = count > 1 ? index / (count - 1) : 1;
    glyph.release = Math.max(glyph.end + MIN_HOLD, leaveBy - wave * (1 - across));
  });
};

const toLine = (line: Line): PrismaLine | null => {
  if (!line.fullText?.trim()) return null;
  const glyphs: PrismaGlyph[] = buildLineGraphemeTimeline(line).map((timing) => ({
    char: timing.char,
    start: timing.startTime,
    end: timing.endTime,
    wordIndex: timing.wordIndex,
    land: timing.startTime - PRISMA_LAND_LEAD,
    release: Infinity,
  }));
  return {
    text: line.fullText,
    glyphs,
    start: line.startTime,
    end: Math.max(line.endTime, getLineRenderEndTime(line)),
    isChorus: Boolean(line.isChorus),
    source: line,
  };
};

const toTitleLine = (title: string, end: number): PrismaLine => {
  const glyphs: PrismaGlyph[] = splitLyricGraphemes(title).map((char, index) => {
    const start = TITLE_LAND_START + index * TITLE_LAND_STEP;
    return { char, start, end: start, land: start, release: Infinity };
  });
  return { text: title, glyphs, start: TITLE_LAND_START, end, isChorus: false, source: null };
};

/** Ways a flight can move at random: 0 scatter, 1 whirl, 2 gust, 3 drift, 4 ribbon, 5 core, 6 ripple. */
export const PRISMA_MOTION_COUNT = 7;
/** A motion stays out of the running for this many flights after it plays. */
const MOTION_REST = 2;
/** The firework is never drawn at random: it marks a moment, and it stays rare. */
export const PRISMA_FIREWORK = PRISMA_MOTION_COUNT;
/** The line it lands on needs this long, or most of its shards land before seeing the sky. */
const FIREWORK_MIN_LINE = 1.5;

/**
 * What the song's animation intensity allows. `chorus` is the set for flights that touch a chorus. For the
 * firework, `spacing` is the fewest flights between two, `gap` a wait before a line worth marking, and `fallback`
 * how often a song with no chorus marks and no pauses still gets one. Calm has no fireworks at all.
 */
const MOTION_PROFILES: Record<
  PrismaIntensity,
  {
    pool: number[];
    chorus: number[];
    firework: { spacing: number; gap: number; fallback: number } | null;
  }
> = {
  calm: { pool: [0, 3, 4, 6], chorus: [0, 4, 6], firework: null },
  normal: {
    pool: [0, 1, 2, 3, 4, 5, 6],
    chorus: [0, 1, 5],
    firework: { spacing: 6, gap: 3, fallback: 18 },
  },
  chaotic: {
    pool: [0, 1, 2, 3, 4, 5, 6],
    chorus: [0, 1, 2, 5],
    firework: { spacing: 3, gap: 1.5, fallback: 8 },
  },
};

const seedHash = (seed: string | number) => {
  let hash = 2166136261;
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
};

/**
 * One motion per flight (flight i goes from line i - 1 to line i, so one more than there are lines). It comes
 * from the song and the position alone: a seek or a replay of the same song shows the same thing.
 */
export const pickPrismaMotions = (
  script: PrismaLine[],
  seed: string | number,
  intensity: PrismaIntensity = "normal",
): PrismaMotion[] => {
  const profile = MOTION_PROFILES[intensity];
  const rule = profile.firework;
  let state = seedHash(seed);
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const recent: number[] = [];
  const motions: PrismaMotion[] = [];
  let sinceFirework = rule?.spacing ?? 0;
  for (let flight = 0; flight <= script.length; flight += 1) {
    const before = script[flight - 1];
    const after = script[flight];
    const chorus = before?.isChorus === true || after?.isChorus === true;
    const firework =
      rule !== null &&
      before !== undefined &&
      after !== undefined &&
      sinceFirework >= rule.spacing &&
      after.end - after.start >= FIREWORK_MIN_LINE &&
      ((after.isChorus && !before.isChorus) ||
        after.start - before.end >= rule.gap ||
        sinceFirework >= rule.fallback);
    sinceFirework += 1;
    if (firework) {
      sinceFirework = 1;
      motions.push({ motion: PRISMA_FIREWORK, turn: random() < 0.5 ? -1 : 1 });
      continue;
    }
    const pool = (chorus ? profile.chorus : profile.pool).filter(
      (motion) => !recent.includes(motion),
    );
    const motion = at(pool, Math.floor(random() * pool.length));
    recent.push(motion);
    if (recent.length > MOTION_REST) recent.shift();
    motions.push({ motion, turn: random() < 0.5 ? -1 : 1 });
  }
  return motions;
};

/** The lines to perform, in order: the lyrics, preceded by the title when there is time for it. */
export const buildPrismaScript = (lines: Line[], title: string | null): PrismaLine[] => {
  const script = lines.flatMap((line) => toLine(line) ?? []);
  const cleanTitle = title?.trim();
  if (cleanTitle) {
    const firstStart = script[0]?.start ?? Infinity;
    if (firstStart >= TITLE_MIN_INTRO) {
      script.unshift(toTitleLine(cleanTitle, firstStart === Infinity ? Infinity : firstStart - 1));
    }
  }
  script.forEach((line, index) => {
    if (line.end === Infinity) return; // the title of a song without lyrics stays
    scheduleRelease(line, script[index + 1]?.start ?? null);
  });
  return script;
};

/** The last line whose first glyph has landed by `time`, or -1 before the first. */
export const findPrismaLineIndex = (script: PrismaLine[], time: number) => {
  let low = 0;
  let high = script.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (at(script, middle).start - PRISMA_LAND_LEAD <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
};
