export interface AudioFeatureIdentity {
  authorityId: string | null;
  sessionId: string | null;
}

/** The stable, consumer-side subset of the versioned desktop feature contract. */
export interface AudioFeatureFrameLike {
  authorityId: string;
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  sequence: number;
  sessionId: string;
  spectrum: number[];
  streamId: string;
  treble: number;
  vocal: number;
}

export interface AudioFeatureValues {
  bass: number;
  lowMid: number;
  mid: number;
  power: number;
  spectrum: Uint8Array;
  treble: number;
  vocal: number;
}

const FRESH_FRAME_WINDOW_MS = 250;
const STALE_FRAME_WINDOW_MS = 1_000;
const STALE_DECAY_END_RATIO = 0.01;
const SMOOTHING_TIME_CONSTANT_MS = 90;
const MAX_RETIRED_STREAM_IDS = 32;

const ZERO_VALUES: Omit<AudioFeatureValues, "spectrum"> = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  power: 0,
  treble: 0,
  vocal: 0,
};

/**
 * A renderer-local AudioFeature consumer. Transport timing never drives its
 * animation: frames only set targets, while this runtime advances on its own rAF.
 */
export class AudioFeatureRuntime {
  private animationFrame: number | null = null;
  private expectedIdentity: AudioFeatureIdentity = { authorityId: null, sessionId: null };
  private lastAnimationAt: number | null = null;
  private lastReceivedAt: number | null = null;
  private lastSequence = -1;
  private output: AudioFeatureValues = createZeroValues(0);
  /** Stream IDs superseded within the current Authority/session identity. */
  private readonly retiredStreamIds = new Set<string>();
  private spectrumLength = 0;
  private streamId: string | null = null;
  private target: AudioFeatureValues = createZeroValues(0);

  setExpectedIdentity(identity: AudioFeatureIdentity): void {
    const nextIdentity = normalizeIdentity(identity);
    if (
      this.expectedIdentity.authorityId === nextIdentity.authorityId &&
      this.expectedIdentity.sessionId === nextIdentity.sessionId
    ) {
      return;
    }

    this.expectedIdentity = nextIdentity;
    this.lastReceivedAt = null;
    this.lastSequence = -1;
    this.retiredStreamIds.clear();
    this.streamId = null;
  }

  /**
   * Accepts only the selected reliable playback identity. A publisher reconnect
   * creates a new stream ordering epoch, while replaced stream IDs remain retired
   * so their delayed frames cannot take ownership back. `receivedAt` deliberately
   * uses the consumer's monotonic clock, not the producer's sampledAt timestamp.
   */
  accept(frame: AudioFeatureFrameLike, receivedAt = performance.now()): boolean {
    if (!this.matchesExpectedIdentity(frame) || !isFiniteNonNegativeInteger(frame.sequence)) {
      return false;
    }
    if (this.retiredStreamIds.has(frame.streamId)) return false;
    if (this.streamId !== null && frame.streamId !== this.streamId) {
      // Publisher reconnects always begin at sequence zero. Requiring that
      // boundary prevents a delayed or unrelated non-zero stream from taking
      // ownership of the current ordering epoch.
      if (frame.sequence !== 0) return false;
      this.retireCurrentStream();
      this.streamId = frame.streamId;
      this.lastSequence = -1;
    }
    if (frame.sequence <= this.lastSequence) return false;

    this.streamId = frame.streamId;
    this.lastSequence = frame.sequence;
    this.lastReceivedAt = Number.isFinite(receivedAt) ? receivedAt : performance.now();
    this.spectrumLength = frame.spectrum.length;
    this.target = toAudioFeatureValues(frame, this.spectrumLength);
    return true;
  }

  /** Returns the target at a moment without coupling it to the animation clock. */
  getTarget(now = performance.now()): AudioFeatureValues {
    const decay = this.resolveDecay(now);
    return scaleAudioFeatureValues(this.target, decay, this.spectrumLength);
  }

  /** Advances the local smooth state once; useful for tests and non-React consumers. */
  advance(now = performance.now()): AudioFeatureValues {
    const previousAnimationAt = this.lastAnimationAt;
    this.lastAnimationAt = now;
    const deltaMs =
      previousAnimationAt === null
        ? 1000 / 60
        : Math.max(0, Math.min(100, now - previousAnimationAt));
    const smoothing = 1 - Math.exp(-deltaMs / SMOOTHING_TIME_CONSTANT_MS);
    const target = this.getTarget(now);

    this.output = {
      bass: ease(this.output.bass, target.bass, smoothing),
      lowMid: ease(this.output.lowMid, target.lowMid, smoothing),
      mid: ease(this.output.mid, target.mid, smoothing),
      power: ease(this.output.power, target.power, smoothing),
      spectrum: easeSpectrum(this.output.spectrum, target.spectrum, smoothing),
      treble: ease(this.output.treble, target.treble, smoothing),
      vocal: ease(this.output.vocal, target.vocal, smoothing),
    };
    return this.output;
  }

  /** Starts an rAF loop owned by this renderer. It does not update React state. */
  start(onValues: (values: AudioFeatureValues) => void): void {
    this.stop();
    const tick = (now: number) => {
      onValues(this.advance(now));
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.lastAnimationAt = null;
  }

  private matchesExpectedIdentity(frame: AudioFeatureFrameLike): boolean {
    return (
      this.expectedIdentity.authorityId !== null &&
      this.expectedIdentity.sessionId !== null &&
      frame.authorityId === this.expectedIdentity.authorityId &&
      frame.sessionId === this.expectedIdentity.sessionId &&
      typeof frame.streamId === "string" &&
      frame.streamId.length > 0
    );
  }

  private retireCurrentStream(): void {
    if (this.streamId === null) return;

    this.retiredStreamIds.add(this.streamId);
    while (this.retiredStreamIds.size > MAX_RETIRED_STREAM_IDS) {
      const oldest = this.retiredStreamIds.values().next().value;
      if (oldest === undefined) return;
      this.retiredStreamIds.delete(oldest);
    }
  }

  private resolveDecay(now: number): number {
    if (this.lastReceivedAt === null) return 0;
    const ageMs = Math.max(0, now - this.lastReceivedAt);
    if (ageMs <= FRESH_FRAME_WINDOW_MS) return 1;
    if (ageMs > STALE_FRAME_WINDOW_MS) return 0;

    const staleProgress =
      (ageMs - FRESH_FRAME_WINDOW_MS) / (STALE_FRAME_WINDOW_MS - FRESH_FRAME_WINDOW_MS);
    return Math.exp(Math.log(STALE_DECAY_END_RATIO) * staleProgress);
  }
}

function normalizeIdentity(identity: AudioFeatureIdentity): AudioFeatureIdentity {
  return {
    authorityId: identity.authorityId || null,
    sessionId: identity.sessionId || null,
  };
}

function createZeroValues(spectrumLength: number): AudioFeatureValues {
  return { ...ZERO_VALUES, spectrum: new Uint8Array(spectrumLength) };
}

function toAudioFeatureValues(
  frame: Omit<AudioFeatureFrameLike, "authorityId" | "sequence" | "sessionId" | "streamId">,
  spectrumLength: number,
): AudioFeatureValues {
  return {
    bass: clampAudioMagnitude(frame.bass),
    lowMid: clampAudioMagnitude(frame.lowMid),
    mid: clampAudioMagnitude(frame.mid),
    power: clampAudioMagnitude(frame.power),
    spectrum: Uint8Array.from({ length: spectrumLength }, (_, index) =>
      clampAudioMagnitude(frame.spectrum[index] ?? 0),
    ),
    treble: clampAudioMagnitude(frame.treble),
    vocal: clampAudioMagnitude(frame.vocal),
  };
}

function scaleAudioFeatureValues(
  values: AudioFeatureValues,
  scale: number,
  spectrumLength: number,
): AudioFeatureValues {
  return {
    bass: values.bass * scale,
    lowMid: values.lowMid * scale,
    mid: values.mid * scale,
    power: values.power * scale,
    spectrum: Uint8Array.from({ length: spectrumLength }, (_, index) =>
      Math.round((values.spectrum[index] ?? 0) * scale),
    ),
    treble: values.treble * scale,
    vocal: values.vocal * scale,
  };
}

function ease(current: number, target: number, amount: number): number {
  return current + (target - current) * amount;
}

function easeSpectrum(current: Uint8Array, target: Uint8Array, amount: number): Uint8Array {
  return Uint8Array.from({ length: target.length }, (_, index) =>
    Math.round(ease(current[index] ?? 0, target[index] ?? 0, amount)),
  );
}

function clampAudioMagnitude(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(255, value)) : 0;
}

function isFiniteNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
