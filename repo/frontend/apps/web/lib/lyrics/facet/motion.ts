import { RhineBeatDetector } from "@/lib/lyrics/rhine/beat";
import type {
  FacetAudioSample,
  FacetLyricSample,
  FacetMotionFrame,
  FacetMotionStats,
  FacetTear,
} from "@/types/lyrics/facet/background";

// lib/lyrics/facet/motion.ts
// How the song moves the Facet background. Nothing here runs on its own schedule:
// - each new lyric line turns the hexagon over, so the big gesture lands where the singing does;
// - the ripples flow as fast as the music is loud, and every kick pushes them forward;
// - the hexagon grows and darkens with loudness, relative to this song's own recent range, and fades in the gaps;
// - tears are saved for loud passages.
// The flow only ever accumulates frame time: input, song changes and settings cannot restart it, and pausing simply
// stops adding to it.

/** The shader only takes the flow's fractional part, so wrapping is seamless and keeps float precision. */
const FLOW_WRAP = 16;
const TICKS_PER_SECOND = 24;
const FLOW_QUIET = 0.03;
const FLOW_LOUD = 0.34;
const FLOW_UNREACTIVE = 0.09;
/** Flow added by a kick, per second, and how quickly that push dies away. */
const KICK_PUSH = 0.7;
const KICK_PUSH_DECAY = 6;
const TURN_SECONDS = 0.7;
/** Fewest seconds between turns: quick lines share one rather than spinning the hexagon constantly. */
const TURN_SPACING = 1.5;
/** Without a sung line for this long, a kick may turn the hexagon instead. */
const INSTRUMENTAL_TURN_AFTER = 6;
/** With no audio or lyrics at all, the hexagon still turns now and then. */
const IDLE_TURN_AFTER = 12;
const TEAR_REFRACTORY = 6;
const TEAR_SECONDS = 0.2;
/** How far up the song's recent range the music must be for a tear. */
const TEAR_ENERGY = 0.8;
const BURST_DECAY = 6;
/** How many seconds the recent loudest and quietest levels take to relax, so a verse reads quiet next to a chorus. */
const RANGE_MEMORY = 45;
/** A narrower range than this is not treated as dynamics, so a flat master does not amplify small changes. */
const RANGE_MIN = 0.08;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** A frame-rate independent move of `current` toward `target`. */
const follow = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
const smooth = (low: number, high: number, value: number) => {
  const t = clamp01((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};

export function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export class FacetMotion {
  private flow = 0;
  private push = 0;
  private realTime = 0;
  private low = 0;
  private mid = 0;
  private high = 0;
  private level = 0;
  private peak = 0;
  private floor = 1;
  private energy = 0;
  private swell = 0;
  private burst = 0;
  private singing = 0;
  private lineProgress = 0;
  private lineIndex = -1;
  /** 0 and 1 are the two faces the hexagon rests on; a turn goes from one to the other. */
  private face = 0;
  private turn = -1;
  private sinceTurn = Infinity;
  private sinceTear = Infinity;
  private tearLeft = 0;
  private tear: FacetTear | null = null;
  private random: number;
  private stats: FacetMotionStats = { kicks: 0, turns: 0, tears: 0, energy: 0, samples: 0 };
  private readonly beats = new RhineBeatDetector();

  constructor(seed: string) {
    this.random = hashSeed(seed);
  }

  private next() {
    this.random = (this.random + 0x6d2b79f5) | 0;
    let mixed = Math.imul(this.random ^ (this.random >>> 15), 1 | this.random);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  /** Starts a tear now unless one started too recently; `strength` scales how far it shifts. */
  triggerTear(strength: number) {
    if (this.sinceTear < TEAR_REFRACTORY || strength <= 0) return;
    this.sinceTear = 0;
    this.tearLeft = TEAR_SECONDS;
    this.burst = 1;
    this.stats.tears += 1;
    const vertical = this.next() < 0.25;
    const signed = this.next() * 2 - 1;
    const height = vertical ? 0.3 + this.next() * 0.4 : 0.03 + this.next() * 0.1;
    this.tear = {
      y: vertical ? 0 : this.next() * (1 - height),
      height,
      shiftX: vertical ? 0 : signed * 0.5 * strength,
      shiftY: vertical ? signed * 0.2 * strength : 0,
    };
  }

  /** Starts turning the hexagon over unless a turn is running or has just finished. */
  private startTurn() {
    if (this.turn >= 0 || this.sinceTurn < TURN_SPACING) return false;
    this.turn = 0;
    this.sinceTurn = 0;
    this.stats.turns += 1;
    return true;
  }

  advance(
    dt: number,
    audio: FacetAudioSample | null,
    lyric: FacetLyricSample | null,
    strength: number,
  ) {
    this.realTime += dt;
    this.sinceTear += dt;
    this.sinceTurn += dt;
    this.low = follow(this.low, audio?.low ?? 0, 10, dt);
    this.mid = follow(this.mid, audio?.mid ?? 0, 8, dt);
    this.high = follow(this.high, audio?.high ?? 0, 14, dt);
    this.burst *= Math.exp(-BURST_DECAY * dt);
    this.swell = follow(this.swell, 0, 7, dt);
    this.push *= Math.exp(-KICK_PUSH_DECAY * dt);
    if (this.tearLeft > 0) {
      this.tearLeft -= dt;
      if (this.tearLeft <= 0) this.tear = null;
    }

    const loudness = this.low * 0.5 + this.mid * 0.35 + this.high * 0.15;
    this.level = follow(this.level, loudness, 3, dt);
    const relax = 1 - Math.exp(-dt / RANGE_MEMORY);
    this.peak = Math.max(this.level, this.peak + (this.level - this.peak) * relax);
    this.floor = Math.min(this.level, this.floor + (this.level - this.floor) * relax);
    const range = Math.max(this.peak - this.floor, RANGE_MIN);
    this.energy = audio ? clamp01((this.level - this.floor) / range) : 0;
    this.stats.energy += this.energy;
    this.stats.samples += 1;

    let kicked = false;
    if (audio) {
      const { onsets } = this.beats.update(audio.spectrum, dt);
      if (onsets[0]) {
        kicked = true;
        this.stats.kicks += 1;
        this.swell = Math.max(this.swell, clamp01(onsets[0]));
        this.push = KICK_PUSH;
      }
      if (onsets[1] && this.energy > TEAR_ENERGY) this.triggerTear(strength);
    }

    const sung = lyric?.singing ?? false;
    this.singing = follow(this.singing, sung ? 1 : 0, 4, dt);
    this.lineProgress = sung ? (lyric?.progress ?? 0) : follow(this.lineProgress, 0, 3, dt);
    const lineIndex = lyric?.lineIndex ?? -1;
    if (lineIndex !== this.lineIndex) {
      const started = lineIndex >= 0 && this.startTurn();
      this.lineIndex = lineIndex;
      if (started && this.energy > TEAR_ENERGY) this.triggerTear(strength);
    } else if (!sung && kicked && this.sinceTurn > INSTRUMENTAL_TURN_AFTER) {
      this.startTurn();
    } else if (!audio && !sung && this.sinceTurn > IDLE_TURN_AFTER) {
      this.startTurn();
    }

    if (this.turn >= 0) {
      this.turn += dt / TURN_SECONDS;
      if (this.turn >= 1) {
        this.turn = -1;
        this.face = 1 - this.face;
      }
    }

    const speed = audio
      ? FLOW_QUIET + (FLOW_LOUD - FLOW_QUIET) * this.energy ** 1.5 + this.push * strength
      : FLOW_UNREACTIVE;
    this.flow = (this.flow + dt * speed) % FLOW_WRAP;
  }

  frame(strength: number): FacetMotionFrame {
    const turning = this.turn >= 0;
    const progress = turning ? this.turn : 0;
    // A small wind-up against the direction of the turn, then the swing, as in the original's kick.
    const swing = -0.1 * smooth(0, 0.25, progress) + 1.1 * smooth(0.2, 0.8, progress);
    const reach = Math.max(this.energy, this.singing * 0.6);
    return {
      flow: this.flow,
      tick: Math.floor(this.realTime * TICKS_PER_SECOND),
      blend: (swing + this.face) * 0.5,
      turn: progress,
      turning: turning ? 1 : 0,
      scale:
        0.74 +
        (0.34 * reach + 0.14 * this.swell + 0.05 * this.lineProgress * this.singing) *
          Math.min(strength, 1.5),
      presence: 0.3 + 0.7 * clamp01(reach * Math.max(strength, 0.5)),
      thickness: (this.mid - 0.5) * 0.14 * strength,
      grain: clamp01(this.high * strength),
      burst: this.burst,
      tear: this.tear,
    };
  }

  /** What the song did to the motion since the last call, for the frame report. */
  takeStats() {
    const { kicks, turns, tears, energy, samples } = this.stats;
    this.stats = { kicks: 0, turns: 0, tears: 0, energy: 0, samples: 0 };
    return { kicks, turns, tears, energy: samples > 0 ? energy / samples : 0, samples };
  }
}

/** The pose of the static-mode image: the same every time, between two morphs. */
export const FACET_STILL_FRAME: FacetMotionFrame = {
  flow: 0.3,
  tick: 0,
  blend: 0,
  turn: 0,
  turning: 0,
  scale: 1,
  presence: 1,
  thickness: 0,
  grain: 0,
  burst: 0,
  tear: null,
};
