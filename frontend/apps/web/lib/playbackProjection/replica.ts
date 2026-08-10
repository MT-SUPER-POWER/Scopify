import {
  type PlaybackClockAnchor,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackMessage,
  type PlaybackPhase,
  type PlaybackProjection,
  type PlaybackSessionState,
  validatePlaybackMessage,
} from "@scopify/desktop-contract";

import type {
  PlaybackMessageApplyResult,
  PlaybackProjectionSource,
  PlaybackReplicaOptions,
} from "@/types/playbackProjection";

export const DEFAULT_PLAYBACK_DISCONNECT_AFTER_MS = 5_000;

const INITIAL_SESSION_STATE: PlaybackSessionState = {
  canControl: false,
  durationMs: 0,
  liked: false,
  lyrics: null,
  lyricsVersion: null,
  phase: "idle",
  track: null,
  volume: 1,
};

function phaseAdvances(phase: PlaybackPhase): boolean {
  return phase === "playing";
}

export class PlaybackReplica<TLyrics = unknown> implements PlaybackProjectionSource<TLyrics> {
  private anchor: PlaybackClockAnchor | null = null;
  private authorityId: string | null = null;
  private connection: PlaybackProjection<TLyrics>["connection"] = "connecting";
  private readonly disconnectAfterMs: number;
  private frozenPositionMs = 0;
  private lastReliableMessageAtMs: number | null = null;
  private lastSequence = -1;
  private readonly listeners = new Set<() => void>();
  private monotonicFloorMs = 0;
  private readonly retiredAuthorityIds = new Set<string>();
  private sessionId: string | null = null;
  private sessionState: PlaybackSessionState<TLyrics> = {
    ...INITIAL_SESSION_STATE,
  } as PlaybackSessionState<TLyrics>;
  private timelineRevision = -1;
  private waitingForBootstrap = true;

  constructor(private readonly options: PlaybackReplicaOptions) {
    this.disconnectAfterMs = options.disconnectAfterMs ?? DEFAULT_PLAYBACK_DISCONNECT_AFTER_MS;
    if (!Number.isFinite(this.disconnectAfterMs) || this.disconnectAfterMs <= 0) {
      throw new RangeError("disconnectAfterMs must be a finite positive duration");
    }
  }

  connect(): void {
    this.freeze("connecting");
  }

  disconnect(): void {
    this.freeze("disconnected");
  }

  async dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    const snapshot = this.getSnapshot();
    if (snapshot.connection !== "connected" || !snapshot.canControl) {
      return {
        commandId: command.commandId,
        reason: "playback-authority-unavailable",
        status: "unavailable",
      };
    }
    if (!this.options.dispatchCommand) {
      return {
        commandId: command.commandId,
        reason: "command-transport-unavailable",
        status: "unavailable",
      };
    }

    try {
      return await this.options.dispatchCommand(command);
    } catch {
      return {
        commandId: command.commandId,
        reason: "command-dispatch-failed",
        status: "unavailable",
      };
    }
  }

  getSnapshot(): PlaybackProjection<TLyrics> {
    const nowMs = this.options.clock.nowMs();
    this.freezeIfAuthorityIsStale(nowMs);
    const positionMs = this.samplePositionAt(nowMs);
    if (this.connection === "connected") {
      this.monotonicFloorMs = Math.max(this.monotonicFloorMs, positionMs);
      this.frozenPositionMs = positionMs;
    }

    return {
      ...this.sessionState,
      connection: this.connection,
      isPlaying: this.sessionState.phase === "playing",
      positionMs,
      sessionId: this.sessionId,
    };
  }

  receive(value: unknown): PlaybackMessageApplyResult {
    const validation = validatePlaybackMessage<TLyrics>(value);
    if (!validation.success) {
      return { accepted: false, detail: validation.reason, reason: "invalid-message" };
    }

    const message = validation.message;
    if (this.retiredAuthorityIds.has(message.authorityId)) {
      return { accepted: false, reason: "retired-authority" };
    }
    if (message.type === "bootstrap") return this.applyBootstrap(message);
    if (this.waitingForBootstrap || this.authorityId === null || this.sessionId === null) {
      return { accepted: false, reason: "bootstrap-required" };
    }
    if (message.authorityId !== this.authorityId) {
      return { accepted: false, reason: "authority-bootstrap-required" };
    }
    if (message.sequence <= this.lastSequence) {
      return { accepted: false, reason: "duplicate-or-out-of-order" };
    }
    if (message.sessionId !== this.sessionId) {
      return { accepted: false, reason: "session-bootstrap-required" };
    }

    return this.applySessionMessage(message);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private applyBootstrap(
    message: Extract<PlaybackMessage<TLyrics>, { type: "bootstrap" }>,
  ): PlaybackMessageApplyResult {
    if (this.retiredAuthorityIds.has(message.authorityId)) {
      return { accepted: false, reason: "retired-authority" };
    }
    if (message.authorityId === this.authorityId && message.sequence <= this.lastSequence) {
      return { accepted: false, reason: "duplicate-or-out-of-order" };
    }

    const sameAuthoritySession =
      message.authorityId === this.authorityId && message.sessionId === this.sessionId;
    if (sameAuthoritySession && message.anchor.timelineRevision < this.timelineRevision) {
      return { accepted: false, reason: "stale-timeline-revision" };
    }

    const nowMs = this.options.clock.nowMs();
    const sameTimeline =
      sameAuthoritySession && message.anchor.timelineRevision === this.timelineRevision;
    const previousPositionMs = sameTimeline ? this.samplePositionAt(nowMs) : 0;

    if (this.authorityId !== null && message.authorityId !== this.authorityId) {
      this.retiredAuthorityIds.add(this.authorityId);
    }

    this.authorityId = message.authorityId;
    this.sessionId = message.sessionId;
    this.lastSequence = message.sequence;
    this.timelineRevision = message.anchor.timelineRevision;
    this.sessionState = message.state;
    this.anchor = message.anchor;
    this.monotonicFloorMs = sameTimeline ? previousPositionMs : 0;
    this.frozenPositionMs = this.sampleConnectedPositionAt(nowMs);
    this.lastReliableMessageAtMs = nowMs;
    this.connection = "connected";
    this.waitingForBootstrap = false;
    this.notify();
    return { accepted: true };
  }

  private applySessionMessage(message: Exclude<PlaybackMessage<TLyrics>, { type: "bootstrap" }>) {
    const messageRevision =
      message.type === "state-changed" ? message.timelineRevision : message.anchor.timelineRevision;

    if (messageRevision < this.timelineRevision) {
      return { accepted: false, reason: "stale-timeline-revision" } as const;
    }
    if (message.type === "timeline-discontinued") {
      if (messageRevision <= this.timelineRevision) {
        return { accepted: false, reason: "non-increasing-timeline-revision" } as const;
      }
      this.applyDiscontinuity(message.anchor);
    } else {
      if (messageRevision > this.timelineRevision) {
        return { accepted: false, reason: "timeline-discontinuity-required" } as const;
      }
      if (message.type === "state-changed") this.applyStateChanged(message);
      if (message.type === "clock-anchored") this.applyRoutineAnchor(message.anchor);
    }

    this.lastSequence = message.sequence;
    this.lastReliableMessageAtMs = this.options.clock.nowMs();
    this.connection = "connected";
    this.waitingForBootstrap = false;
    this.notify();
    return { accepted: true } as const;
  }

  private applyDiscontinuity(anchor: PlaybackClockAnchor): void {
    this.timelineRevision = anchor.timelineRevision;
    this.anchor = anchor;
    this.monotonicFloorMs = 0;
    this.frozenPositionMs = this.sampleConnectedPositionAt(this.options.clock.nowMs());
  }

  private applyRoutineAnchor(anchor: PlaybackClockAnchor): void {
    const nowMs = this.options.clock.nowMs();
    const visiblePositionMs = this.samplePositionAt(nowMs);
    this.anchor = anchor;
    this.monotonicFloorMs = visiblePositionMs;
    this.frozenPositionMs = this.sampleConnectedPositionAt(nowMs);
  }

  private applyStateChanged(
    message: Extract<PlaybackMessage<TLyrics>, { type: "state-changed" }>,
  ): void {
    const nowMs = this.options.clock.nowMs();
    const sampledAtMs = Math.min(nowMs, Math.max(0, message.sampledAtMs));
    const transitionPositionMs = Math.max(this.monotonicFloorMs, this.projectAnchorAt(sampledAtMs));
    this.sessionState = message.state;
    this.monotonicFloorMs = transitionPositionMs;

    if (!phaseAdvances(message.state.phase)) {
      this.anchor = {
        positionMs: transitionPositionMs,
        rate: 0,
        sampledAtMs,
        timelineRevision: this.timelineRevision,
      };
    }
    this.frozenPositionMs = this.sampleConnectedPositionAt(nowMs);
  }

  private freeze(connection: "connecting" | "disconnected"): void {
    const nowMs = this.options.clock.nowMs();
    const positionMs = this.samplePositionAt(nowMs);
    const changed = this.connection !== connection || !this.waitingForBootstrap;
    this.frozenPositionMs = positionMs;
    this.monotonicFloorMs = positionMs;
    this.connection = connection;
    this.waitingForBootstrap = true;
    if (changed) this.notify();
  }

  private freezeIfAuthorityIsStale(nowMs: number): void {
    if (
      this.connection !== "connected" ||
      this.lastReliableMessageAtMs === null ||
      nowMs - this.lastReliableMessageAtMs <= this.disconnectAfterMs
    ) {
      return;
    }

    const staleAtMs = this.lastReliableMessageAtMs + this.disconnectAfterMs;
    this.frozenPositionMs = this.sampleConnectedPositionAt(staleAtMs);
    this.monotonicFloorMs = this.frozenPositionMs;
    this.connection = "disconnected";
    // A watchdog timeout is a soft disconnect: ordering/session state remains
    // trustworthy, so the next reliable message can recover without reopening
    // the MessagePort solely to request another Bootstrap.
    this.waitingForBootstrap = false;
  }

  private samplePositionAt(nowMs: number): number {
    if (this.connection !== "connected") return Math.max(0, this.frozenPositionMs);
    return this.sampleConnectedPositionAt(nowMs);
  }

  private sampleConnectedPositionAt(nowMs: number): number {
    return Math.max(this.monotonicFloorMs, this.projectAnchorAt(nowMs));
  }

  private projectAnchorAt(nowMs: number): number {
    if (!this.anchor) return this.clampPosition(0);

    const elapsedMs = Math.max(0, nowMs - this.anchor.sampledAtMs);
    const projectedPositionMs =
      this.anchor.positionMs +
      (phaseAdvances(this.sessionState.phase) ? elapsedMs * this.anchor.rate : 0);
    return this.clampPosition(projectedPositionMs);
  }

  private clampPosition(positionMs: number): number {
    const nonNegativePositionMs = Math.max(0, positionMs);
    if (this.sessionState.durationMs <= 0) return nonNegativePositionMs;
    return Math.min(nonNegativePositionMs, this.sessionState.durationMs);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

export function createPlaybackReplica<TLyrics = unknown>(
  options: PlaybackReplicaOptions,
): PlaybackReplica<TLyrics> {
  return new PlaybackReplica<TLyrics>(options);
}
