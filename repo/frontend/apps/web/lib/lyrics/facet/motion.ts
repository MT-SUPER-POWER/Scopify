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
// - each sung word lights one more facet, spiralling out from the centre, which then dims to a glow for the line;
// - a new line lets the last one's facets fade, and sends a ring of light out from the centre;
// - a kick sends a fainter ring and nudges the ripples forward, and the geometry itself never moves with the beat;
// - the chorus opens the window of facets across the screen and rotates it a sixth of a turn, ending where a hexagon
//   looks the same as it started; without chorus data, loudness relative to the song's own range decides;
// - gaps in the singing leave little more than the structure, breathing slowly.
// The flow only ever accumulates frame time: input, song changes and settings cannot restart it, and pausing simply
// stops adding to it.

/** The shader only takes the flow's fractional part, so wrapping is seamless and keeps float precision. */
const FLOW_WRAP = 16;
const TICKS_PER_SECOND = 24;
const FLOW_QUIET = 0.03;
const FLOW_LOUD = 0.2;
const FLOW_UNREACTIVE = 0.07;
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
/** How far the chorus's one slip goes at normal intensity, against a full tear. */
const CHORUS_SLIP = 0.35;
const BURST_DECAY = 6;
/** How many seconds the recent loudest and quietest levels take to relax, so a verse reads quiet next to a chorus. */
const RANGE_MEMORY = 45;
/** A narrower range than this is not treated as dynamics, so a flat master does not amplify small changes. */
const RANGE_MIN = 0.08;

/** Must match LIGHT_SLOTS in scene.frag. */
const LIGHT_SLOTS = 128;
/** What a sung facet settles to while its line lasts, and how quickly it gets there and then leaves. */
const LIGHT_SUNG = 0.34;
const LIGHT_SETTLE_RATE = 1.1;
const LIGHT_FADE_RATE = 1.6;
/** Facets per unit of the view and the window's size, as in scene.frag: they say how many facets can be seen. */
const FACETS_PER_UNIT = 4;
const WINDOW_CLOSED = 0.62;
const WINDOW_OPEN = 2.1;
const RING_SLOTS = 4;
const RING_SPEED = 1.3;
const RING_DECAY = 2.2;
const RING_LINE = 1;
const RING_KICK = 0.45;
/** How open the window is when only verses are playing; the chorus takes it to 1. */
const OPEN_VERSE = 0.1;
const OPEN_VERSE_LOUD = 0.22;
const OPEN_RATE = 0.8;
const CLOSE_RATE = 0.45;
const BREATH_SECONDS = 8;

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
  /** Loudness, slow enough that nothing reads as a pulse. */
  private reach = 0;
  private burst = 0;
  private singing = 0;
  private hasLyrics = false;
  private chorus = false;
  private loudSection = false;
  private sectionTimer = 0;
  private open = OPEN_VERSE;
  /** How many sixths of a turn the hexagon has settled on; a turn adds one. */
  private face = 0;
  private turn = -1;
  private sinceTurn = Infinity;
  private sinceTear = Infinity;
  private tearLeft = 0;
  private tear: FacetTear | null = null;
  private random: number;
  private lineIndex = -1;
  private wordsLit = 0;
  private readonly lightLevels = new Float32Array(LIGHT_SLOTS);
  private readonly lightSung = new Uint8Array(LIGHT_SLOTS);
  private readonly lights = new Uint8Array(LIGHT_SLOTS);
  private readonly rings = new Float32Array(RING_SLOTS * 2);
  private stats: FacetMotionStats = {
    kicks: 0,
    words: 0,
    lines: 0,
    turns: 0,
    tears: 0,
    energy: 0,
    samples: 0,
  };
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

  private startTear(strength: number) {
    if (this.sinceTear < TEAR_REFRACTORY || strength <= 0) return;
    this.sinceTear = 0;
    this.tearLeft = TEAR_SECONDS;
    this.burst = Math.min(strength, 1);
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

  /** A tear on request, which only the highest intensity honours; `strength` scales how far it shifts. */
  triggerTear(strength: number) {
    if (this.intensity === "chaotic") this.startTear(strength);
  }

  /** Starts a section's turn unless one is running or has just finished. */
  private startTurn() {
    if (this.turn >= 0 || this.sinceTurn < TURN_SPACING) return;
    this.turn = 0;
    this.sinceTurn = 0;
    this.stats.turns += 1;
  }

  /** Believes a change of section only once the level has stayed there a while, so one loud bar does not count. */
  private followLoudness(dt: number) {
    const crossing = this.loudSection ? this.energy < SECTION_QUIET : this.energy > SECTION_LOUD;
    this.sectionTimer = crossing ? this.sectionTimer + dt : 0;
    const needed = this.loudSection ? SECTION_QUIET_SECONDS : SECTION_LOUD_SECONDS;
    if (this.sectionTimer >= needed) {
      this.loudSection = !this.loudSection;
      this.sectionTimer = 0;
    }
    return this.loudSection;
  }

  private setChorus(chorus: boolean, strength: number) {
    if (chorus === this.chorus) return;
    this.chorus = chorus;
    this.startTurn();
    if (!chorus) return;
    if (this.intensity === "chaotic") this.startTear(strength);
    else if (this.intensity === "normal") this.startTear(strength * CHORUS_SLIP);
  }

  private sendRing(strength: number) {
    let weakest = 0;
    for (let slot = 1; slot < RING_SLOTS; slot += 1) {
      if ((this.rings[slot * 2 + 1] ?? 0) < (this.rings[weakest * 2 + 1] ?? 0)) weakest = slot;
    }
    this.rings[weakest * 2] = 0;
    this.rings[weakest * 2 + 1] = strength;
  }

  /** How many facets of the spiral fit in the window right now, so that a word always lights one that can be seen. */
  private visibleFacets() {
    const radius = WINDOW_CLOSED + (WINDOW_OPEN - WINDOW_CLOSED) * this.open;
    const ringsSeen = Math.max(1, Math.floor(radius * FACETS_PER_UNIT) - 1);
    return Math.min(LIGHT_SLOTS, 1 + 3 * ringsSeen * (ringsSeen + 1));
  }

  private followLyric(lyric: FacetLyricSample | null) {
    const lineIndex = lyric?.lineIndex ?? -1;
    if (lineIndex !== this.lineIndex) {
      this.lineIndex = lineIndex;
      this.wordsLit = 0;
      this.lightSung.fill(0);
      if (lineIndex >= 0) {
        this.sendRing(RING_LINE);
        this.stats.lines += 1;
      }
    }
    const wordsSung = lyric?.wordsSung ?? 0;
    if (wordsSung < this.wordsLit) this.wordsLit = wordsSung;
    const visible = this.visibleFacets();
    while (this.wordsLit < wordsSung) {
      const slot = this.wordsLit % visible;
      this.lightLevels[slot] = 1;
      this.lightSung[slot] = 1;
      this.wordsLit += 1;
      this.stats.words += 1;
    }
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

    this.followLyric(lyric);
    if (audio) {
      const { onsets } = this.beats.update(audio.spectrum, dt);
      if (onsets[0]) {
        this.stats.kicks += 1;
        this.push = KICK_PUSH;
        this.sendRing(RING_KICK * clamp01(onsets[0]));
      }
      if (onsets[1] && this.energy > TEAR_ENERGY) this.triggerTear(strength);
      this.setChorus(lyric?.chorus ?? this.followLoudness(dt), strength);
    } else {
      this.setChorus(lyric?.chorus ?? false, strength);
      if (this.sinceTurn > IDLE_TURN_AFTER && !lyric?.singing) this.startTurn();
    }

    this.hasLyrics = lyric !== null && lyric.lineIndex >= 0;
    this.singing = follow(this.singing, lyric?.singing ? 1 : 0, 2, dt);
    this.reach = follow(this.reach, this.energy, 1.2, dt);
    const openTarget = this.chorus ? 1 : OPEN_VERSE + (OPEN_VERSE_LOUD - OPEN_VERSE) * this.reach;
    this.open = follow(this.open, openTarget, openTarget > this.open ? OPEN_RATE : CLOSE_RATE, dt);

    for (let slot = 0; slot < LIGHT_SLOTS; slot += 1) {
      const sung = this.lightSung[slot] === 1;
      const level = follow(
        this.lightLevels[slot] ?? 0,
        sung ? LIGHT_SUNG : 0,
        sung ? LIGHT_SETTLE_RATE : LIGHT_FADE_RATE,
        dt,
      );
      this.lightLevels[slot] = level;
      this.lights[slot] = Math.round(clamp01(level) * 255);
    }
    for (let slot = 0; slot < RING_SLOTS; slot += 1) {
      this.rings[slot * 2] = (this.rings[slot * 2] ?? 0) + RING_SPEED * dt;
      this.rings[slot * 2 + 1] = (this.rings[slot * 2 + 1] ?? 0) * Math.exp(-RING_DECAY * dt);
    }

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
    const scaled = Math.min(strength, 1.5);
    // A song without lyrics has no gaps to fall back into, so loudness alone holds the picture up.
    const voiced = this.hasLyrics ? Math.max(this.singing, this.chorus ? 1 : 0) : 1;
    const breath = Math.sin((this.realTime * Math.PI * 2) / BREATH_SECONDS);
    return {
      flow: this.flow,
      tick: Math.floor(this.realTime * TICKS_PER_SECOND),
      blend: (this.face + eased) / 6,
      scale: 0.96 + 0.1 * this.reach * scaled + 0.015 * breath,
      open: this.open,
      presence: clamp01(0.22 + (0.5 + 0.28 * this.reach) * voiced * Math.max(strength, 0.5)),
      thickness: (this.mid - 0.5) * 0.08 * strength,
      grain: clamp01(this.high * strength),
      burst: this.burst,
      tear: this.tear,
      lights: this.lights,
      rings: this.rings,
    };
  }

  /** What the song did to the motion since the last call, for the frame report. */
  takeStats() {
    const { kicks, words, lines, turns, tears, energy, samples } = this.stats;
    this.stats = { kicks: 0, words: 0, lines: 0, turns: 0, tears: 0, energy: 0, samples: 0 };
    return {
      kicks,
      words,
      lines,
      turns,
      tears,
      energy: samples > 0 ? energy / samples : 0,
      samples,
    };
  }
}

/** The pose of the static-mode image: the same every time, with the first ring of facets lit. */
const STILL_LIGHTS = new Uint8Array(LIGHT_SLOTS);
STILL_LIGHTS.fill(110, 0, 7);
export const FACET_STILL_FRAME: FacetMotionFrame = {
  flow: 0.3,
  tick: 0,
  blend: 0,
  scale: 1,
  open: OPEN_VERSE_LOUD,
  presence: 0.8,
  thickness: 0,
  grain: 0,
  burst: 0,
  tear: null,
  lights: STILL_LIGHTS,
  rings: new Float32Array(RING_SLOTS * 2),
};
