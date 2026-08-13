import type {
  RuntimePlaybackHostControl,
  RuntimePlaybackHostControlClientPayload,
  RuntimePlaybackHostControlConnection,
  RuntimePlaybackHostControlHostPayload,
} from "@/lib/runtime";

/** The hidden Host retries its low-frequency control port without a busy loop. */
export const PLAYBACK_HOST_CONTROL_RECONNECT_INITIAL_DELAY_MS = 250;
export const PLAYBACK_HOST_CONTROL_RECONNECT_MAX_DELAY_MS = 5_000;

export interface PlaybackHostControlReconnectTimer {
  clearTimeout(handle: unknown): void;
  setTimeout(callback: () => void, delayMs: number): unknown;
}

export interface PlaybackHostControlConnectionOptions {
  connectionId: string;
  onPayload: (payload: RuntimePlaybackHostControlHostPayload) => void;
  port: Pick<RuntimePlaybackHostControl, "connectHost">;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  timer?: PlaybackHostControlReconnectTimer;
}

interface ControlAttempt {
  closed: boolean;
  connection: RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlClientPayload> | null;
  generation: number;
}

const defaultTimer: PlaybackHostControlReconnectTimer = {
  clearTimeout: (handle) =>
    globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
};

/**
 * Keeps exactly one Host control port and at most one reconnect timer alive.
 * Every port callback carries its connection generation, so a delayed close
 * from a retired MessagePort cannot tear down the newer Host registration.
 */
export class PlaybackHostControlConnection {
  private active = false;
  private attempt: ControlAttempt | null = null;
  private generation = 0;
  private reconnectAttempt = 0;
  private reconnectTimer: unknown | null = null;

  constructor(private readonly options: PlaybackHostControlConnectionOptions) {
    if (!options.connectionId)
      throw new TypeError("Playback Host control connectionId is required.");
    validateDelay(
      options.initialReconnectDelayMs ?? PLAYBACK_HOST_CONTROL_RECONNECT_INITIAL_DELAY_MS,
    );
    validateDelay(options.maxReconnectDelayMs ?? PLAYBACK_HOST_CONTROL_RECONNECT_MAX_DELAY_MS);
    if (this.maxReconnectDelayMs < this.initialReconnectDelayMs) {
      throw new RangeError(
        "Playback Host control maximum reconnect delay must not be smaller than initial delay.",
      );
    }
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.generation += 1;
    this.reconnectAttempt = 0;
    this.connect(this.generation);
  }

  stop(): void {
    if (!this.active && this.attempt === null && this.reconnectTimer === null) return;
    this.active = false;
    this.generation += 1;
    this.clearReconnectTimer();
    this.closeAttempt(this.attempt);
    this.attempt = null;
  }

  send(payload: RuntimePlaybackHostControlClientPayload): boolean {
    const attempt = this.attempt;
    if (!attempt || !this.isAttemptCurrent(attempt) || !attempt.connection) return false;
    return attempt.connection.send(payload);
  }

  private connect(generation: number): void {
    if (!this.isCurrent(generation) || this.attempt !== null) return;

    const attempt: ControlAttempt = { closed: false, connection: null, generation };
    this.attempt = attempt;

    try {
      const connection = this.options.port.connectHost(
        this.options.connectionId,
        (payload) => {
          if (!this.isAttemptCurrent(attempt)) return;
          // A valid inbound message proves this connection survived long enough
          // to be useful, so the next independent failure starts from the base delay.
          this.reconnectAttempt = 0;
          this.options.onPayload(payload);
        },
        () => this.handleClose(attempt),
      );
      attempt.connection = connection;
      if (!this.isAttemptCurrent(attempt)) connection.close();
    } catch {
      this.closeAttempt(attempt);
      if (this.attempt === attempt) this.attempt = null;
      this.scheduleReconnect(generation);
    }
  }

  private handleClose(attempt: ControlAttempt): void {
    if (!this.isAttemptCurrent(attempt)) return;
    this.closeAttempt(attempt);
    this.attempt = null;
    this.scheduleReconnect(attempt.generation);
  }

  private scheduleReconnect(generation: number): void {
    if (!this.isCurrent(generation) || this.reconnectTimer !== null) return;

    const delayMs = Math.min(
      this.initialReconnectDelayMs * 2 ** this.reconnectAttempt,
      this.maxReconnectDelayMs,
    );
    this.reconnectAttempt += 1;
    this.reconnectTimer = this.timer.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(generation);
    }, delayMs);
  }

  private closeAttempt(attempt: ControlAttempt | null): void {
    if (!attempt || attempt.closed) return;
    attempt.closed = true;
    attempt.connection?.close();
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;
    this.timer.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private isCurrent(generation: number): boolean {
    return this.active && generation === this.generation;
  }

  private isAttemptCurrent(attempt: ControlAttempt): boolean {
    return this.isCurrent(attempt.generation) && this.attempt === attempt && !attempt.closed;
  }

  private get initialReconnectDelayMs(): number {
    return this.options.initialReconnectDelayMs ?? PLAYBACK_HOST_CONTROL_RECONNECT_INITIAL_DELAY_MS;
  }

  private get maxReconnectDelayMs(): number {
    return this.options.maxReconnectDelayMs ?? PLAYBACK_HOST_CONTROL_RECONNECT_MAX_DELAY_MS;
  }

  private get timer(): PlaybackHostControlReconnectTimer {
    return this.options.timer ?? defaultTimer;
  }
}

export function createPlaybackHostControlConnection(
  options: PlaybackHostControlConnectionOptions,
): PlaybackHostControlConnection {
  return new PlaybackHostControlConnection(options);
}

function validateDelay(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Playback Host control reconnect delay must be finite and non-negative.");
  }
}
