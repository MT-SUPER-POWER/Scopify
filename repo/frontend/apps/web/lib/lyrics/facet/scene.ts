import {
  FACET_ADAPTIVE_IGNORE_MS,
  FACET_ADAPTIVE_LATE_SHARE,
  FACET_ADAPTIVE_SCALES,
  FACET_ADAPTIVE_WINDOW,
  FACET_FADE_SECONDS,
  FACET_HISTORY_WEIGHT,
  FACET_LATE_FRAME_RATIO,
  FACET_QUALITY,
  FACET_SLEW_PER_SECOND,
  FACET_STILL_SAMPLES,
} from "@/constants/facetBackground";
import { FACET_STILL_FRAME, FacetMotion, hashSeed } from "@/lib/lyrics/facet/motion";
import type { FacetRenderer } from "@/lib/lyrics/facet/renderer";
import type {
  FacetAudioSample,
  FacetLyricSample,
  FacetPalette,
  FacetSceneInput,
} from "@/types/lyrics/facet/background";

// lib/lyrics/facet/scene.ts
// Owns one Facet background's state between frames: the motion, the palette's fade, and the adaptive size.

const PALETTE_KEYS = ["paper", "ink", "accent", "secondary"] as const;

const samePalette = (left: FacetPalette, right: FacetPalette) =>
  PALETTE_KEYS.every((key) => left[key].every((value, index) => value === right[key][index]));

const clonePalette = (palette: FacetPalette): FacetPalette => ({
  paper: [...palette.paper],
  ink: [...palette.ink],
  accent: [...palette.accent],
  secondary: [...palette.secondary],
});

const seedAngle = (seed: string) => (hashSeed(seed) % 1000) / 1000;

export class FacetScene {
  private input: FacetSceneInput;
  private readonly motion: FacetMotion;
  /** What is on screen, fading toward `input`. */
  private palette: FacetPalette;
  private seedShown: number;
  private seedTarget: number;
  private width = 0;
  private height = 0;
  private scaleIndex = 0;
  private rendered = 0;
  private late = 0;
  /** Set when the buffers have nothing usable in them, so the next frame must not blend with its history. */
  private historyStale = true;
  private lastDt = 0;

  constructor(
    private readonly renderer: FacetRenderer,
    input: FacetSceneInput,
  ) {
    this.input = input;
    this.motion = new FacetMotion(input.seed);
    this.motion.intensity = input.intensity;
    this.palette = clonePalette(input.palette);
    this.seedShown = this.seedTarget = seedAngle(input.seed);
  }

  private applySize() {
    if (this.width <= 0 || this.height <= 0) return false;
    const changed = this.renderer.resize(
      this.width,
      this.height,
      FACET_QUALITY[this.input.tuning.quality].maxPixels,
      FACET_ADAPTIVE_SCALES[this.scaleIndex] ?? 1,
    );
    if (changed) this.historyStale = true;
    return changed;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.applySize() || this.input.frozen) this.paint();
  }

  /** Takes new props. Returns whether a stopped background has to repaint to show them. */
  setInput(input: FacetSceneInput) {
    const previous = this.input;
    this.input = input;
    this.motion.intensity = input.intensity;
    const seedChanged = previous.seed !== input.seed;
    if (seedChanged) {
      this.seedTarget = seedAngle(input.seed);
      if (!input.frozen && input.tuning.musicEnabled) {
        this.motion.triggerTear(input.tuning.strength);
      }
    }
    const qualityChanged = previous.tuning.quality !== input.tuning.quality;
    if (qualityChanged) {
      this.scaleIndex = 0;
      this.rendered = 0;
      this.late = 0;
      this.applySize();
    }
    if (!input.frozen) return false;
    const paletteChanged = !samePalette(this.palette, input.palette);
    if (paletteChanged) this.palette = clonePalette(input.palette);
    if (seedChanged) this.seedShown = this.seedTarget;
    return (
      seedChanged ||
      qualityChanged ||
      paletteChanged ||
      previous.frozen !== input.frozen ||
      previous.still !== input.still ||
      previous.vignette !== input.vignette
    );
  }

  /** Records how long a rendered frame took; a run of late ones steps the internal size down. */
  private adapt(elapsedMs: number) {
    if (elapsedMs > FACET_ADAPTIVE_IGNORE_MS) return;
    const budget = 1000 / Number(this.input.tuning.frameRate);
    this.rendered += 1;
    if (elapsedMs > budget * FACET_LATE_FRAME_RATIO) this.late += 1;
    if (this.rendered < FACET_ADAPTIVE_WINDOW) return;
    const share = this.late / this.rendered;
    this.rendered = 0;
    this.late = 0;
    if (share < FACET_ADAPTIVE_LATE_SHARE || this.scaleIndex >= FACET_ADAPTIVE_SCALES.length - 1) {
      return;
    }
    this.scaleIndex += 1;
    this.applySize();
    console.info(
      `[FacetBackground] ${Math.round(share * 100)}% of frames late at ${this.input.tuning.frameRate} FPS: ` +
        `internal size now ${this.renderer.size.width}x${this.renderer.size.height}`,
    );
  }

  advance(elapsedMs: number, audio: FacetAudioSample | null, lyric: FacetLyricSample | null) {
    const dt = Math.min(elapsedMs / 1000, 0.1);
    this.lastDt = dt;
    const { tuning, palette: target } = this.input;
    this.motion.advance(
      dt,
      tuning.musicEnabled ? audio : null,
      tuning.musicEnabled ? lyric : null,
      tuning.strength,
    );
    const fade = 1 - Math.exp((-dt * 3) / FACET_FADE_SECONDS);
    for (const key of PALETTE_KEYS) {
      this.palette[key] = this.palette[key].map(
        (value, index) => value + ((target[key][index] ?? value) - value) * fade,
      );
    }
    this.seedShown += (this.seedTarget - this.seedShown) * fade;
    this.adapt(elapsedMs);
    this.paint();
  }

  setCover(cover: ImageBitmap | null) {
    this.renderer.setCover(cover);
    if (this.input.frozen) this.paint();
  }

  takeStats() {
    return this.motion.takeStats();
  }

  paint() {
    if (this.width <= 0 || this.height <= 0) return;
    const { still, frozen, tuning, vignette, intensity } = this.input;
    const quality = FACET_QUALITY[tuning.quality];
    this.renderer.render({
      motion: still ? FACET_STILL_FRAME : this.motion.frame(tuning.strength),
      palette: this.palette,
      quality,
      seed: this.seedShown,
      // A stopped repaint has only itself to show, so it cannot lean on the frames before it.
      historyWeight: this.historyStale || frozen ? 0 : FACET_HISTORY_WEIGHT,
      maxDelta: FACET_SLEW_PER_SECOND[intensity] * this.lastDt,
      samples: frozen ? FACET_STILL_SAMPLES : quality.samples,
      vignette,
    });
    this.historyStale = false;
  }
}
