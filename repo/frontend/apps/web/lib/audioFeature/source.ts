import type { AudioFeatureFrameV1, PlaybackProjection } from "@scopifymusicplayer/desktop-contract";

import { AudioFeatureSampler } from "@/lib/playbackHost/audioFeatureSampler";
import { downsampleSpectrum } from "@/lib/desktopPlaybackWallpaper/playback";
import type { LyricAudioBands } from "@/types/lyrics";

export const AUDIO_FEATURE_SAMPLE_INTERVAL_MS = 33;
export const AUDIO_FEATURE_MAX_SPECTRUM_BINS = 256;

/**
 * One renderer owns at most one analyser-backed source. Presentation and the
 * desktop publisher read this same source so they never maintain independent
 * FFT-to-band conversion paths.
 */
export interface AudioFeatureSource {
  readBands(): LyricAudioBands | null;
}

interface AnalyserAudioFeatureSourceOptions {
  analyser: AnalyserNode;
  isPaused: () => boolean;
}

let activeAudioFeatureSource: AudioFeatureSource | null = null;

/** Registers the analyser source for this renderer and returns its exact cleanup. */
export function registerAudioFeatureSource(source: AudioFeatureSource): () => void {
  if (activeAudioFeatureSource && activeAudioFeatureSource !== source) {
    throw new Error("Only one audio feature source may be registered per renderer");
  }

  activeAudioFeatureSource = source;
  return () => {
    if (activeAudioFeatureSource === source) activeAudioFeatureSource = null;
  };
}

/** Returns the current renderer's analyser reader, if its media graph is ready. */
export function getAudioFeatureSource(): AudioFeatureSource | null {
  return activeAudioFeatureSource;
}

/** Creates the reusable FFT reader used by both Folia and the Host publisher. */
export function createAnalyserAudioFeatureSource({
  analyser,
  isPaused,
}: AnalyserAudioFeatureSourceOptions): AudioFeatureSource {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  return {
    readBands() {
      if (isPaused()) return null;

      analyser.getByteFrequencyData(frequencyData);
      const bass = averageFrequencyRange(frequencyData, 20, 150);
      const lowMid = averageFrequencyRange(frequencyData, 150, 400);
      return {
        bass: emphasize(bass, 1.8),
        lowMid: emphasize(lowMid, 2),
        mid: emphasize(averageFrequencyRange(frequencyData, 400, 1200), 2),
        power: emphasize((bass + lowMid) / 2, 3),
        spectrum: Array.from(frequencyData),
        treble: emphasize(averageFrequencyRange(frequencyData, 3500, 12000), 2),
        vocal: emphasize(averageFrequencyRange(frequencyData, 1000, 3500), 1.5),
      };
    },
  };
}

interface AudioFeatureHostSamplerTimer {
  clearInterval(handle: ReturnType<typeof setInterval>): void;
  setInterval(callback: () => void, intervalMs: number): ReturnType<typeof setInterval>;
}

export interface AudioFeatureHostSamplerOptions {
  getProjection: () => PlaybackProjection;
  getSource?: () => AudioFeatureSource | null;
  intervalMs?: number;
  nowMs?: () => number;
  publish: (frame: AudioFeatureFrameV1) => boolean;
  timer?: AudioFeatureHostSamplerTimer;
}

/**
 * Host-only 30fps publisher. It is intentionally decoupled from DOM events
 * and wallpaper state: the Host samples its local analyser whether or not the
 * visible window is minimized, hidden, or destroyed.
 */
export class AudioFeatureHostSampler {
  private interval: ReturnType<typeof setInterval> | null = null;
  private readonly sampler: AudioFeatureSampler;

  constructor(private readonly options: AudioFeatureHostSamplerOptions) {
    this.sampler = new AudioFeatureSampler({
      nowMs: options.nowMs,
      sink: { publish: (frame) => options.publish(frame) },
    });
  }

  start(): void {
    if (this.interval !== null) return;
    const timer = this.options.timer ?? globalThis;
    this.interval = timer.setInterval(() => {
      this.sample();
    }, this.options.intervalMs ?? AUDIO_FEATURE_SAMPLE_INTERVAL_MS);
  }

  sample(): boolean {
    const projection = this.options.getProjection();
    if (projection.connection !== "connected" || !projection.authorityId || !projection.sessionId) {
      this.sampler.setIdentity(null);
      return false;
    }

    const source = (this.options.getSource ?? getAudioFeatureSource)();
    const bands = source?.readBands();
    if (!bands) return false;

    this.sampler.setIdentity({
      authorityId: projection.authorityId,
      sessionId: projection.sessionId,
    });
    const published = this.sampler.publish({
      ...bands,
      spectrum: downsampleSpectrum(bands.spectrum, AUDIO_FEATURE_MAX_SPECTRUM_BINS),
    });
    // AudioFeatureSampler clears its stream after a failed best-effort write.
    // Reset the identity too, so the next interval creates a fresh stream rather
    // than remaining inert until the Authority happens to change sessions.
    if (!published) this.sampler.setIdentity(null);
    return published;
  }

  /** Clears the current stream when a transport closes before a reconnect. */
  disconnect(): void {
    this.sampler.stop();
  }

  stop(): void {
    if (this.interval !== null) {
      (this.options.timer ?? globalThis).clearInterval(this.interval);
      this.interval = null;
    }
    this.disconnect();
  }
}

function averageFrequencyRange(data: Uint8Array, minimumHz: number, maximumHz: number): number {
  const start = Math.floor(minimumHz / 21.5);
  const end = Math.min(data.length - 1, Math.floor(maximumHz / 21.5));
  let total = 0;
  for (let index = start; index <= end; index += 1) total += data[index] ?? 0;
  return end >= start ? total / (end - start + 1) : 0;
}

function emphasize(value: number, boost: number): number {
  return Math.pow(value / 255, boost) * 255;
}
