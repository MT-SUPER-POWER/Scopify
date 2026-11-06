import type { Theme } from "@/components/lyrics/folia/src/types";
import {
  resolveThemeFontStack,
  resolveThemeFontWeight,
} from "@/components/lyrics/folia/src/utils/fontStacks";
import { resolveWordColor } from "@/components/lyrics/folia/src/components/visualizer/wordColoring";
import { createFrameStats, type FrameStatsReport } from "@/lib/lyrics/frameStats";
import type {
  PrismaBatchEnd,
  PrismaLine,
  PrismaLineLayout,
  PrismaMotion,
  PrismaRuntimeInput,
  PrismaSong,
  PrismaTiles,
  PrismaTuning,
} from "@/types/lyrics/prisma/model";
import { at } from "./at";
import { buildPrismaBatch } from "./batch";
import {
  PRISMA_PLATE_LAYERS,
  PrismaGl,
  type PrismaFrameUniforms,
  type PrismaGpuBatch,
  type PrismaGpuGlyphs,
} from "./gl";
import { layoutPrismaLine } from "./layout";
import { cutPrismaTiles, PrismaRaster } from "./raster";
import { buildPrismaScript, findPrismaLineIndex, pickPrismaMotions } from "./timeline";

// lib/lyrics/prisma/runtime.ts
// 聚散's runtime: a canvas, a WebGL2 context and its own frame loop. The shell pushes in the song, tuning and
// theme; time and audio are read inside the loop and never enter React state. A line is prepared a piece at a
// time on the frames before it is needed, so preparing never costs one long frame.

/** Most shards in one flight, by quality level. The level only ever goes down, when frames run long. */
const SHARD_CAPS = [6000, 4000, 2000];
const REPORT_MS = 15_000;
/** A level is too heavy when two reports in a row are worse than these: below about 45 fps, or long stalls. */
const SLOW_AVERAGE_MS = 22;
const SLOW_P95_MS = 40;
/** A gap this long is the window being hidden or throttled, not a frame the GPU took too long on. */
const THROTTLED_GAP_MS = 250;
const MAX_DPR = 2;
const CHORUS_BURST = 1.35;
/** A firework goes off this long after its flight starts, leaving the line time to stream up. */
const FIREWORK_DELAY = 0.5;

type Rgb = [number, number, number];

interface Plate {
  layout: PrismaLineLayout;
  /** The drawn text waiting to be read back; null once done. */
  box: { x: number; y: number; width: number; height: number } | null;
  layer: number;
  tiles: PrismaTiles | null;
  glyphs: PrismaGpuGlyphs | null;
}

export class PrismaRuntime {
  private readonly canvas = document.createElement("canvas");
  private readonly gl: PrismaGl;
  private readonly raster = new PrismaRaster();
  private readonly colorContext = document.createElement("canvas").getContext("2d");
  private readonly observer: ResizeObserver;
  private readonly plates = new Map<number, Plate>();
  private readonly batches = new Map<number, PrismaGpuBatch>();
  private readonly frameUniforms: PrismaFrameUniforms = {
    time: 0,
    burst: 1,
    motion: 0,
    turn: 1,
    fireAt: 0,
    flow: 1,
    swarm: 0,
    bass: 0,
    pulse: 0,
    treble: 0,
    gloss: 1,
    music: 1,
    glowBase: 0,
  };
  private readonly stats = createFrameStats("Prisma", {
    reportMs: REPORT_MS,
    onReport: (report) => this.adaptQuality(report),
  });
  private script: PrismaLine[] = [];
  private motions: PrismaMotion[] = [];
  private song: PrismaSong = { lines: [], seed: "prisma" };
  private width = 0;
  private height = 0;
  private dpr = 1;
  private fontScale = 1;
  private showText = true;
  private paused = false;
  private still = false;
  private quality = 0;
  private slowReports = 0;
  private raf = 0;
  private dead = false;
  private firstDrawn = false;
  private fontReady = true;
  private bass = 0;
  private treble = 0;
  private power = 0;
  private vocal = 0;
  private lastFrameAt = 0;
  private glowPad = 0;
  private primary: Rgb = [255, 255, 255];
  private accent: Rgb = [255, 255, 255];

  constructor(
    private readonly input: PrismaRuntimeInput,
    private theme: Theme,
    private tuning: PrismaTuning,
  ) {
    this.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    input.host.appendChild(this.canvas);
    try {
      this.gl = new PrismaGl(this.canvas);
    } catch (error) {
      this.canvas.remove();
      throw error;
    }
    console.info(`[Prisma] rendering on ${this.gl.adapter}`);
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", input.onRestored);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(input.host);
    document.addEventListener("visibilitychange", this.handleVisibility);
    document.fonts?.addEventListener("loadingdone", this.handleFontsLoaded);
    this.applyTheme();
    this.resize();
  }

  setSong(song: PrismaSong) {
    this.song = song;
    this.rebuild();
  }

  setFontScale(scale: number) {
    if (scale === this.fontScale) return;
    this.fontScale = scale;
    this.rebuild();
  }

  setShowText(show: boolean) {
    if (show === this.showText) return;
    this.showText = show;
    this.rebuild();
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    this.applyTheme();
    this.rebuild();
  }

  setTuning(tuning: PrismaTuning) {
    const rebuild =
      tuning.shardSize !== this.tuning.shardSize || tuning.showTitle !== this.tuning.showTitle;
    this.tuning = tuning;
    if (rebuild) this.rebuild();
    this.requestFrame();
  }

  setPlayback(paused: boolean, still: boolean) {
    this.paused = paused;
    this.still = still;
    if (paused) this.stats.pause();
    this.requestFrame();
  }

  /** Draws one frame when the loop is stopped (a seek while paused). */
  requestFrame() {
    if (!this.raf && !this.dead) this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibility);
    document.fonts?.removeEventListener("loadingdone", this.handleFontsLoaded);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.input.onRestored);
    this.clearPrepared();
    this.gl.destroy();
    this.canvas.remove();
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.dead = true;
    this.input.onFailed();
  };

  private handleVisibility = () => {
    this.stats.pause();
    this.lastFrameAt = 0;
  };

  // Other fonts finishing also lands here: only redo the work when the theme's font just became usable.
  private handleFontsLoaded = () => {
    if (this.dead) return;
    const ready = this.isFontReady();
    const arrived = ready && !this.fontReady;
    this.fontReady = ready;
    if (!arrived) return;
    this.raster.clearMeasurements();
    this.rebuild();
  };

  private fontSpec(px: number) {
    return `${resolveThemeFontWeight(this.theme, 600)} ${px}px ${resolveThemeFontStack(this.theme)}`;
  }

  private isFontReady() {
    try {
      return document.fonts?.check(this.fontSpec(32)) ?? true;
    } catch {
      return true;
    }
  }

  private parseColor(color: string | undefined, fallback: Rgb): Rgb {
    const context = this.colorContext;
    if (!color || !context) return fallback;
    context.fillStyle = "#000";
    context.fillStyle = color;
    const value = String(context.fillStyle);
    if (value.startsWith("#")) {
      const number = parseInt(value.slice(1, 7), 16);
      return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
    }
    const parts = value.match(/[\d.]+/g)?.map(Number);
    return parts && parts.length >= 3 ? [at(parts, 0), at(parts, 1), at(parts, 2)] : fallback;
  }

  private applyTheme() {
    this.primary = this.parseColor(this.theme.primaryColor, [255, 255, 255]);
    this.accent = this.parseColor(this.theme.accentColor, this.primary);
    const luminance =
      (0.2126 * this.primary[0] + 0.7152 * this.primary[1] + 0.0722 * this.primary[2]) / 255;
    // Pale text sits on a dark picture, where glow adds light. Dark text on a pale one needs it painted on.
    this.gl.setPalette(
      [this.accent[0] / 255, this.accent[1] / 255, this.accent[2] / 255],
      luminance > 0.4,
    );
    this.fontReady = this.isFontReady();
    // Asking for the font starts its download when the theme's font has not been used yet.
    void document.fonts?.load(this.fontSpec(32)).catch(() => undefined);
  }

  private resize() {
    // Layout size, not the on-screen rectangle: the stage scales in when it opens, and that must not resize this.
    const width = this.input.host.clientWidth;
    const height = this.input.host.clientHeight;
    if (width < 1 || height < 1) return;
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.clearPrepared();
    this.gl.resize(width, height, dpr);
    this.rebuild();
  }

  private clearPrepared() {
    this.plates.forEach((plate) => {
      if (plate.glyphs) this.gl.deleteGlyphs(plate.glyphs);
    });
    this.plates.clear();
    this.batches.forEach((batch) => this.gl.deleteBatch(batch));
    this.batches.clear();
  }

  private rebuild() {
    this.clearPrepared();
    const { lines, title } = this.song;
    this.script = this.showText
      ? buildPrismaScript(lines, this.tuning.showTitle ? (title ?? null) : null)
      : [];
    this.motions = pickPrismaMotions(this.script, this.song.seed);
    this.requestFrame();
  }

  private colorOf = (line: PrismaLine, glyphIndex: number): Rgb => {
    const glyph = at(line.glyphs, glyphIndex);
    const word = glyph.wordIndex === undefined ? null : line.source?.words[glyph.wordIndex];
    if (word) {
      const color = resolveWordColor(word.text, this.theme.wordColors, "");
      if (color) return this.parseColor(color, this.primary);
    }
    if (!line.isChorus) return this.primary;
    const mix = 0.28;
    return [
      this.primary[0] + (this.accent[0] - this.primary[0]) * mix,
      this.primary[1] + (this.accent[1] - this.primary[1]) * mix,
      this.primary[2] + (this.accent[2] - this.primary[2]) * mix,
    ];
  };

  private takeLayer(index: number, keepFrom: number, keepTo: number) {
    const used = new Set<number>();
    this.plates.forEach((plate) => used.add(plate.layer));
    for (let layer = 0; layer < PRISMA_PLATE_LAYERS; layer += 1) {
      if (!used.has(layer)) return layer;
    }
    let farthest = -1;
    let distance = -1;
    this.plates.forEach((_, key) => {
      if (key >= keepFrom && key <= keepTo) return;
      const away = Math.abs(key - index);
      if (away > distance) {
        distance = away;
        farthest = key;
      }
    });
    if (farthest < 0) return -1;
    const plate = this.plates.get(farthest);
    if (!plate) return -1;
    if (plate.glyphs) this.gl.deleteGlyphs(plate.glyphs);
    this.plates.delete(farthest);
    return plate.layer;
  }

  /** Does one step of preparing a line. Returns false when there was nothing to do. */
  private preparePlate(index: number, current: number) {
    if (index < 0 || index >= this.script.length) return false;
    const existing = this.plates.get(index);
    if (existing?.tiles) return false;
    if (existing?.box) {
      const image = this.raster.read(existing.box);
      this.gl.uploadPlate(existing.layer, image);
      existing.tiles = cutPrismaTiles(
        existing.layout,
        image,
        this.dpr,
        this.tuning.shardSize,
        at(SHARD_CAPS, this.quality),
      );
      existing.box = null;
      const line = at(this.script, index);
      existing.glyphs = this.gl.createGlyphs(existing.layout, (glyphIndex) => {
        const glyph = at(line.glyphs, glyphIndex);
        return [glyph.land, glyph.release, glyph.start, glyph.end];
      });
      return true;
    }
    const layer = this.takeLayer(index, current - 1, current + 2);
    if (layer < 0) return false;
    const layout = layoutPrismaLine(at(this.script, index), {
      width: this.width,
      height: this.height,
      fontScale: this.fontScale,
      fontStack: resolveThemeFontStack(this.theme),
      fontWeight: resolveThemeFontWeight(this.theme, 600),
      colorOf: this.colorOf,
      measure: this.raster.measure,
    });
    const box = this.raster.draw(layout, this.dpr, this.gl.deviceWidth, this.gl.deviceHeight);
    this.plates.set(index, { layout, box, layer, tiles: null, glyphs: null });
    return true;
  }

  private batchEnd(index: number): PrismaBatchEnd | null {
    const line = this.script[index];
    const plate = this.plates.get(index);
    return line && plate?.tiles ? { line, layout: plate.layout, tiles: plate.tiles } : null;
  }

  /** Builds flight `index`: the shards going from line index - 1 to line index. */
  private prepareBatch(index: number) {
    if (index < 0 || index > this.script.length || this.batches.has(index)) return false;
    if (this.script.length === 0) return false;
    const from = index > 0 ? this.batchEnd(index - 1) : null;
    const to = index < this.script.length ? this.batchEnd(index) : null;
    if ((index > 0 && !from) || (index < this.script.length && !to)) return false;
    // The title of a song without lyrics never leaves, so it has no flight out.
    if (!to && at(this.script, index - 1).end === Infinity) return false;
    const data = buildPrismaBatch(
      from,
      to,
      { width: this.width, height: this.height },
      index * 2654435761 + 1,
    );
    if (data.count === 0) return false;
    this.batches.set(index, this.gl.createBatch(data));
    return true;
  }

  /** One unit of work per frame, most urgent first. */
  private prepare(current: number) {
    if (
      this.preparePlate(Math.max(current, 0), current) ||
      this.preparePlate(current + 1, current) ||
      this.preparePlate(current - 1, current) ||
      this.prepareBatch(current) ||
      this.prepareBatch(current + 1) ||
      this.preparePlate(current + 2, current) ||
      this.prepareBatch(current + 2)
    ) {
      return;
    }
    // Old flights only hold memory.
    this.batches.forEach((batch, key) => {
      if (key < current - 1 || key > current + 3) {
        this.gl.deleteBatch(batch);
        this.batches.delete(key);
      }
    });
  }

  private updateAudio(now: number) {
    const dt = this.lastFrameAt ? Math.min(0.1, (now - this.lastFrameAt) / 1000) : 1 / 60;
    this.lastFrameAt = now;
    const { audioPower, audioBands } = this.input;
    const follow = (value: number, target: number, attack: number, decay: number) =>
      value + (target - value) * (1 - Math.exp(-dt * (target > value ? attack : decay)));
    const silent = this.paused || this.still;
    this.bass = follow(this.bass, silent ? 0 : audioBands.bass.get() / 255, 40, 7);
    this.treble = follow(this.treble, silent ? 0 : audioBands.treble.get() / 255, 30, 9);
    this.vocal = follow(this.vocal, silent ? 0 : audioBands.vocal.get() / 255, 20, 6);
    this.power = follow(this.power, silent ? 0 : audioPower.get() / 255, 8, 3);
  }

  private adaptQuality(report: FrameStatsReport) {
    if (report.average <= SLOW_AVERAGE_MS && report.p95 <= SLOW_P95_MS) {
      this.slowReports = 0;
      return;
    }
    this.slowReports += 1;
    if (this.slowReports < 2 || this.quality >= SHARD_CAPS.length - 1) return;
    this.slowReports = 0;
    this.quality += 1;
    console.info(
      `[Prisma] frames are long, lowering the shard limit to ${SHARD_CAPS[this.quality]} for the next lines`,
    );
  }

  private drawFrame(time: number, current: number) {
    const { gl, frameUniforms: frame, tuning } = this;
    const audio = tuning.audio;
    frame.time = time;
    frame.flow = tuning.flow * (1 + this.power * 0.5 * audio);
    frame.swarm = tuning.swarm;
    frame.bass = this.bass * audio;
    frame.pulse = this.bass * 0.004 * audio;
    frame.treble = this.treble * audio;
    frame.gloss = tuning.gloss;
    frame.music = Math.min(1.4, 0.4 + audio * 0.6);
    frame.glowBase = 0.05 + this.vocal * 0.28 * audio;

    gl.beginFrame();

    if (this.still) {
      const plate = this.plates.get(Math.max(current, 0));
      if (plate?.glyphs) gl.drawGlyphs(plate.glyphs, plate.layer, frame, 0, false, true);
      return;
    }

    let anyInFlight = false;
    const layerOf = (index: number) => this.plates.get(index)?.layer;
    const visible: [PrismaGpuBatch, number, number][] = [];
    for (let index = Math.max(0, current - 1); index <= current + 2; index += 1) {
      const batch = this.batches.get(index);
      if (!batch || time < batch.from || time > batch.to) continue;
      const fromLayer = index > 0 ? layerOf(index - 1) : -1;
      const toLayer = index < this.script.length ? layerOf(index) : -1;
      if (fromLayer === undefined || toLayer === undefined) continue;
      const chorus =
        this.script[index - 1]?.isChorus === true || this.script[index]?.isChorus === true;
      frame.burst = tuning.burst * (chorus ? CHORUS_BURST : 1);
      frame.motion = this.motions[index]?.motion ?? 0;
      frame.turn = this.motions[index]?.turn ?? 1;
      frame.fireAt = batch.from + FIREWORK_DELAY;
      gl.computePaths(batch, frame, [index === 0, index === this.script.length]);
      visible.push([batch, fromLayer, toLayer]);
      anyInFlight = true;
    }

    // Glow goes under everything; the crisp glyphs and the shards then match pixel for pixel at hand-over.
    for (let index = current - 1; index <= current + 1; index += 1) {
      const plate = this.plates.get(index);
      if (plate?.glyphs) {
        gl.drawGlyphs(plate.glyphs, plate.layer, frame, plate.layout.fontPx * 0.45, true, false);
      }
    }
    for (let index = current - 1; index <= current + 1; index += 1) {
      const plate = this.plates.get(index);
      if (plate?.glyphs) gl.drawGlyphs(plate.glyphs, plate.layer, frame, 0, false, false);
    }
    if (anyInFlight) {
      for (const [batch, fromLayer, toLayer] of visible) {
        gl.drawShards(batch, frame, fromLayer, toLayer);
      }
    }
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.dead || this.gl.isContextLost) return;
    try {
      if (!this.gl.ready) {
        this.raf = requestAnimationFrame(this.frame);
        return;
      }
    } catch (error) {
      console.warn("[Prisma] shaders failed to build", error);
      this.dead = true;
      this.input.onFailed();
      return;
    }
    if (!this.width || !this.height) return;

    if (this.lastFrameAt && now - this.lastFrameAt > THROTTLED_GAP_MS) this.stats.pause();
    const time = this.input.currentTime.get();
    const current = findPrismaLineIndex(this.script, time);
    this.prepare(current);
    this.updateAudio(now);
    this.drawFrame(time, current);
    if (!this.firstDrawn) {
      this.firstDrawn = true;
      this.input.onFirstFrame();
    }
    if (!this.paused) {
      this.stats.sample(now);
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    // Paused: keep going only until the current line has finished preparing.
    const plate = this.plates.get(Math.max(current, 0));
    if (this.script.length && (!plate?.tiles || !this.batches.has(Math.max(current, 0)))) {
      this.raf = requestAnimationFrame(this.frame);
    }
  };
}
