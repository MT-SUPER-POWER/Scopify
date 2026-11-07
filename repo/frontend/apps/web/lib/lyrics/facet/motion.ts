import { RhineBeatDetector } from "@/lib/lyrics/rhine/beat";
import type {
  FacetAudioSample,
  FacetIntensity,
  FacetLyricSample,
  FacetMotionFrame,
  FacetMotionStats,
  FacetTear,
} from "@/types/lyrics/facet/background";

// lib/lyrics/facet/motion.ts
// How the song moves the Facet background. Nothing here runs on its own schedule, and nothing here flashes:
// - the ripples flow as fast as the music is loud, and every kick nudges them forward;
// - the hexagon grows and deepens slowly with loudness, relative to this song's own recent range;
// - when the song changes section it rotates a sixth of a turn, which ends looking the same as it started;
// - tears only exist at the highest animation intensity.
// The flow only ever accumulates frame time: input, song changes and settings cannot restart it, and pausing simply
// stops adding to it.

/** The shader only takes the flow's fractional part, so wrapping is seamless and keeps float precision. */
const FLOW_WRAP = 16;
const TICKS_PER_SECOND = 24;
const FLOW_QUIET = 0.03;
const FLOW_LOUD = 0.34;
const FLOW_UNREACTIVE = 0.09;
/** Flow added by a kick, per second, and how quickly that push dies away. */
const KICK_PUSH = 0.12;
const KICK_PUSH_DECAY = 6;
const TURN_SECONDS = 2.4;
/** Fewest seconds between section turns. */
const TURN_SPACING = 8;
/** With no audio or lyrics at all, the hexagon still turns now and then. */
const IDLE_TURN_AFTER = 20;
/** How far up the song's recent range counts as the loud section, for how many seconds before it is believed. */
const SECTION_LOUD = 0.75;
const SECTION_LOUD_SECONDS = 2;
const SECTION_QUIET = 0.45;
const SECTION_QUIET_SECONDS = 3;
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
  /** Loudness and singing, slow enough that the hexagon's size never reads as a pulse. */
  private reach = 0;
  private burst = 0;
  private singing = 0;
  private loudSection = false;
  private sectionTimer = 0;
  /** How many sixths of a turn the hexagon has settled on; a turn adds one. */
  private face = 0;
  private turn = -1;
  private sinceTurn = Infinity;
  private sinceTear = Infinity;
  private tearLeft = 0;
  private tear: FacetTear | null = null;
  private random: number;
  private stats: FacetMotionStats = { kicks: 0, turns: 0, tears: 0, energy: 0, samples: 0 };
  private readonly beats = new RhineBeatDetector();
  intensity: FacetIntensity = "normal";

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
    if (this.intensity !== "chaotic" || this.sinceTear < TEAR_REFRACTORY || strength <= 0) return;
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

  /** Starts a section's turn unless one is running or has just finished. */
  private startTurn() {
    if (this.turn >= 0 || this.sinceTurn < TURN_SPACING) return;
    this.turn = 0;
    this.sinceTurn = 0;
    this.stats.turns += 1;
  }

  /** Believes a change of section only once the level has stayed there a while, so one loud bar does not count. */
  private followSection(dt: number) {
    const crossing = this.loudSection ? this.energy < SECTION_QUIET : this.energy > SECTION_LOUD;
    this.sectionTimer = crossing ? this.sectionTimer + dt : 0;
    const needed = this.loudSection ? SECTION_QUIET_SECONDS : SECTION_LOUD_SECONDS;
    if (this.sectionTimer < needed) return;
    this.loudSection = !this.loudSection;
    this.sectionTimer = 0;
    this.startTurn();
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
    this.mid = follow(this.mid, audio?.mid ?? 0, 2, dt);
    this.high = follow(this.high, audio?.high ?? 0, 3, dt);
    this.burst *= Math.exp(-BURST_DECAY * dt);
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

    if (audio) {
      const { onsets } = this.beats.update(audio.spectrum, dt);
      if (onsets[0]) {
        this.stats.kicks += 1;
        this.push = KICK_PUSH;
      }
      if (onsets[1] && this.energy > TEAR_ENERGY) this.triggerTear(strength);
      this.followSection(dt);
    } else if (this.sinceTurn > IDLE_TURN_AFTER && !lyric?.singing) {
      this.startTurn();
    }

    const sung = lyric?.singing ?? false;
    this.singing = follow(this.singing, sung ? 1 : 0, 2, dt);
    this.reach = follow(this.reach, Math.max(this.energy, this.singing * 0.6), 1.2, dt);

    if (this.turn >= 0) {
      this.turn += dt / TURN_SECONDS;
      if (this.turn >= 1) {
        this.turn = -1;
        this.face = (this.face + 1) % 6;
      }
    }

    const speed = audio
      ? FLOW_QUIET + (FLOW_LOUD - FLOW_QUIET) * this.energy ** 1.5 + this.push * strength
      : FLOW_UNREACTIVE;
    this.flow = (this.flow + dt * speed) % FLOW_WRAP;
  }

  frame(strength: number): FacetMotionFrame {
    const eased = this.turn >= 0 ? smooth(0, 1, this.turn) : 0;
    return {
      flow: this.flow,
      tick: Math.floor(this.realTime * TICKS_PER_SECOND),
      blend: (this.face + eased) / 6,
      scale: 0.78 + 0.26 * this.reach * Math.min(strength, 1.5),
      presence: 0.3 + 0.5 * clamp01(this.reach * Math.max(strength, 0.5)),
      thickness: (this.mid - 0.5) * 0.08 * strength,
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
  scale: 1,
  presence: 0.8,
  thickness: 0,
  grain: 0,
  burst: 0,
  tear: null,
};
