import type { AudioFeatureFrameV1 } from "@scopifymusicplayer/desktop-contract";

import type { RuntimeAudioFeature, RuntimeUnsubscribe } from "@/lib/runtime";

export const AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS = 1_000;

interface AudioFeatureSubscriberTimer {
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
}

export interface AudioFeatureSubscriberConnectionOptions {
  connectionId: string;
  onFrame: (frame: AudioFeatureFrameV1) => void;
  port: Pick<RuntimeAudioFeature, "connect">;
  reconnectDelayMs?: number;
  timer?: AudioFeatureSubscriberTimer;
}

interface SubscriberAttempt {
  closed: boolean;
  generation: number;
  unsubscribe: RuntimeUnsubscribe | null;
}

/**
 * Owns one best-effort wallpaper subscription at a time. A MessagePort close is
 * recovered through one fixed-delay retry; stale port callbacks cannot revive a
 * stopped or superseded connection generation.
 */
export class AudioFeatureSubscriberConnection {
  private active = false;
  private attempt: SubscriberAttempt | null = null;
  private generation = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: AudioFeatureSubscriberConnectionOptions) {
    if (!options.connectionId)
      throw new TypeError("Audio feature subscriber connectionId is required.");
    const delayMs = options.reconnectDelayMs ?? AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS;
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new RangeError(
        "Audio feature subscriber reconnect delay must be non-negative and finite.",
      );
    }
  }

  /** Opens the subscription. Calling start again replaces its prior generation. */
  start(): void {
    this.stop();
    this.active = true;
    this.generation += 1;
    this.connect(this.generation);
  }

  /** Permanently stops this instance; late frame/close callbacks become no-ops. */
  stop(): void {
    this.active = false;
    this.generation += 1;
    this.clearReconnectTimer();
    this.closeAttempt(this.attempt);
    this.attempt = null;
  }

  private connect(generation: number): void {
    if (!this.isCurrent(generation) || this.attempt !== null) return;

    const attempt: SubscriberAttempt = {
      closed: false,
      generation,
      unsubscribe: null,
    };
    this.attempt = attempt;

    try {
      const unsubscribe = this.options.port.connect(
        "subscriber",
        this.options.connectionId,
        (frame) => {
          if (this.isAttemptCurrent(attempt)) this.options.onFrame(frame);
        },
        () => this.handleClose(attempt),
      );
      attempt.unsubscribe = unsubscribe;

      // A preload implementation may synchronously close the connection while
      // `connect` is returning. Its unsubscriber must still be released.
      if (!this.isAttemptCurrent(attempt)) unsubscribe();
    } catch {
      this.closeAttempt(attempt);
      if (this.attempt === attempt) this.attempt = null;
      this.scheduleReconnect(generation);
    }
  }

  private handleClose(attempt: SubscriberAttempt): void {
    if (!this.isAttemptCurrent(attempt)) return;

    this.closeAttempt(attempt);
    this.attempt = null;
    this.scheduleReconnect(attempt.generation);
  }

  private scheduleReconnect(generation: number): void {
    if (!this.isCurrent(generation) || this.reconnectTimer !== null) return;

    this.reconnectTimer = this.timer.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(generation);
    }, this.reconnectDelayMs);
  }

  private closeAttempt(attempt: SubscriberAttempt | null): void {
    if (!attempt || attempt.closed) return;
    attempt.closed = true;
    attempt.unsubscribe?.();
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;
    this.timer.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private isCurrent(generation: number): boolean {
    return this.active && generation === this.generation;
  }

  private isAttemptCurrent(attempt: SubscriberAttempt): boolean {
    return this.isCurrent(attempt.generation) && this.attempt === attempt && !attempt.closed;
  }

  private get reconnectDelayMs(): number {
    return this.options.reconnectDelayMs ?? AUDIO_FEATURE_SUBSCRIBER_RECONNECT_DELAY_MS;
  }

  private get timer(): AudioFeatureSubscriberTimer {
    return this.options.timer ?? globalThis;
  }
}

export function createAudioFeatureSubscriberConnection(
  options: AudioFeatureSubscriberConnectionOptions,
): AudioFeatureSubscriberConnection {
  return new AudioFeatureSubscriberConnection(options);
}
