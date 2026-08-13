import {
  PLAYBACK_VOLUME_MAX,
  PLAYBACK_PROTOCOL_VERSION,
  type PlaybackBootstrap,
  type PlaybackClockAnchor,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackMessage,
  type PlaybackPhase,
  type PlaybackSessionState,
  type PlaybackStateChanged,
  type PlaybackTimelineDiscontinued,
  type PlaybackTimelineDiscontinuityReason,
} from "@scopifymusicplayer/desktop-contract";

import type {
  PlaybackAuthorityIdentity,
  PlaybackAuthorityIdentityFactory,
  PlaybackAuthorityOptions,
  PlaybackAuthorityStatePatch,
  PlaybackMediaSample,
  PlaybackSessionStartOptions,
} from "@/types/playbackAuthority";

const DEFAULT_HEALTH_ANCHOR_INTERVAL_MS = 1_000;

let fallbackIdentitySequence = 0;

function createDefaultIdentityFactory(): PlaybackAuthorityIdentityFactory {
  const createIdentity = (kind: "authority" | "session") => {
    const randomUuid = globalThis.crypto?.randomUUID?.();
    if (randomUuid) return `${kind}:${randomUuid}`;

    fallbackIdentitySequence += 1;
    return `${kind}:${fallbackIdentitySequence.toString(36)}`;
  };

  return {
    createAuthorityId: () => createIdentity("authority"),
    createSessionId: () => createIdentity("session"),
  };
}

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isValidVolume(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= PLAYBACK_VOLUME_MAX;
}

function cloneState<TLyrics>(state: PlaybackSessionState<TLyrics>): PlaybackSessionState<TLyrics> {
  return {
    ...state,
    track: state.track
      ? {
          ...state.track,
          artistNames: [...state.track.artistNames],
        }
      : null,
  };
}

function sameState<TLyrics>(
  left: PlaybackSessionState<TLyrics>,
  right: PlaybackSessionState<TLyrics>,
): boolean {
  return (
    left.canControl === right.canControl &&
    left.durationMs === right.durationMs &&
    left.liked === right.liked &&
    Object.is(left.lyrics, right.lyrics) &&
    left.lyricsVersion === right.lyricsVersion &&
    left.phase === right.phase &&
    Object.is(left.track, right.track) &&
    left.volume === right.volume
  );
}

function sanitiseSample(sample: PlaybackMediaSample): PlaybackMediaSample {
  const durationMs = isFiniteNonNegative(sample.durationMs) ? sample.durationMs : 0;
  const positionMs = isFiniteNonNegative(sample.positionMs) ? sample.positionMs : 0;
  return {
    durationMs,
    ended: sample.ended,
    errorMessage: sample.errorMessage,
    paused: sample.paused,
    playbackRate:
      Number.isFinite(sample.playbackRate) && sample.playbackRate >= 0 ? sample.playbackRate : 0,
    positionMs: durationMs > 0 ? Math.min(positionMs, durationMs) : positionMs,
    volume: isValidVolume(sample.volume) ? sample.volume : PLAYBACK_VOLUME_MAX,
  };
}

export class PlaybackAuthority<TLyrics = unknown> {
  private authorityId: string | null = null;
  private commandEpoch = 0;
  private readonly commandExecutions = new Map<string, Promise<PlaybackCommandReceipt>>();
  private commandTail: Promise<void> = Promise.resolve();
  private healthAnchorHandle: unknown;
  private readonly healthAnchorIntervalMs: number;
  private readonly identityFactory: PlaybackAuthorityIdentityFactory;
  private sequence = 0;
  private sessionId: string | null = null;
  private started = false;
  private state: PlaybackSessionState<TLyrics> | null = null;
  private timelineRevision = 0;
  private unsubscribeMedia: (() => void) | null = null;

  constructor(private readonly options: PlaybackAuthorityOptions<TLyrics>) {
    this.healthAnchorIntervalMs =
      options.healthAnchorIntervalMs ?? DEFAULT_HEALTH_ANCHOR_INTERVAL_MS;
    if (!Number.isFinite(this.healthAnchorIntervalMs) || this.healthAnchorIntervalMs <= 0) {
      throw new RangeError("healthAnchorIntervalMs must be greater than zero");
    }

    this.identityFactory = options.identityFactory ?? createDefaultIdentityFactory();
  }

  /**
   * A snapshot of the active Authority and media-session identity. The result is
   * recreated for every read so callers cannot mutate Authority internals.
   */
  get currentIdentity(): PlaybackAuthorityIdentity | null {
    if (!this.authorityId || !this.sessionId) return null;
    return Object.freeze({ authorityId: this.authorityId, sessionId: this.sessionId });
  }

  start(initialState: PlaybackSessionState<TLyrics>): void {
    if (this.started) return;

    this.started = true;
    this.authorityId = this.identityFactory.createAuthorityId();
    this.sessionId = this.identityFactory.createSessionId();
    this.sequence = 0;
    this.timelineRevision = 0;
    this.commandEpoch += 1;
    this.commandExecutions.clear();
    this.commandTail = Promise.resolve();

    if (!isValidVolume(initialState.volume)) {
      this.started = false;
      throw new RangeError(
        `initial playback volume must be between zero and ${PLAYBACK_VOLUME_MAX}`,
      );
    }

    this.options.media.setVolume(initialState.volume);
    const sample = this.sampleMedia();
    this.state = this.reconcileMediaState(cloneState(initialState), sample);
    this.unsubscribeMedia = this.options.media.subscribe((event) => this.handleMediaEvent(event));
    this.healthAnchorHandle = this.options.scheduler.setInterval(
      () => this.publishClockAnchor(),
      this.healthAnchorIntervalMs,
    );
    this.publishBootstrap();
  }

  restart(
    initialState: PlaybackSessionState<TLyrics>,
    sessionOptions?: PlaybackSessionStartOptions,
  ): void {
    this.stop();
    this.start(initialState);
    if (sessionOptions?.reason) {
      this.discontinueTimeline(
        sessionOptions.reason,
        sessionOptions.positionMs ?? 0,
        sessionOptions.causedByCommandId,
      );
    }
  }

  stop(): void {
    if (!this.started) return;

    this.started = false;
    this.commandEpoch += 1;
    this.commandExecutions.clear();
    this.commandTail = Promise.resolve();
    this.unsubscribeMedia?.();
    this.unsubscribeMedia = null;
    if (this.healthAnchorHandle !== undefined) {
      this.options.scheduler.clearInterval(this.healthAnchorHandle);
      this.healthAnchorHandle = undefined;
    }

    this.authorityId = null;
    this.sessionId = null;
    this.state = null;
    this.timelineRevision = 0;
  }

  beginSession(
    state: PlaybackSessionState<TLyrics>,
    sessionOptions: PlaybackSessionStartOptions = {},
  ): void {
    this.assertStarted();
    if (!isValidVolume(state.volume)) {
      throw new RangeError(`playback volume must be between zero and ${PLAYBACK_VOLUME_MAX}`);
    }

    const positionMs = sessionOptions.positionMs ?? 0;
    if (!isFiniteNonNegative(positionMs)) {
      throw new RangeError("session position must be a finite non-negative number");
    }

    this.commandEpoch += 1;
    this.commandExecutions.clear();
    this.commandTail = Promise.resolve();
    this.sessionId = this.identityFactory.createSessionId();
    this.timelineRevision = 0;
    this.state = cloneState(state);
    this.options.media.pause();
    this.options.media.setVolume(state.volume);
    this.options.media.seek(positionMs);
    const sample = this.sampleMedia();
    this.state = {
      ...this.state,
      durationMs: isFiniteNonNegative(state.durationMs) ? state.durationMs : 0,
      volume: sample.volume,
    };
    this.emitBootstrap(false);

    if (sessionOptions.reason) {
      this.publishTimelineDiscontinuity(sessionOptions.reason, sessionOptions.causedByCommandId);
    }
  }

  updateState(patch: PlaybackAuthorityStatePatch<TLyrics>): void {
    this.assertStarted();
    const previousState = this.requireState();

    if (patch.volume !== undefined) {
      if (!isValidVolume(patch.volume)) {
        throw new RangeError(`playback volume must be between zero and ${PLAYBACK_VOLUME_MAX}`);
      }
      this.options.media.setVolume(patch.volume);
    }

    const nextState = this.reconcileMediaState(
      {
        ...previousState,
        ...(patch.canControl === undefined ? {} : { canControl: patch.canControl }),
        ...(patch.liked === undefined ? {} : { liked: patch.liked }),
        ...(patch.lyrics === undefined ? {} : { lyrics: patch.lyrics }),
        ...(patch.lyricsVersion === undefined ? {} : { lyricsVersion: patch.lyricsVersion }),
        ...(patch.track === undefined ? {} : { track: patch.track }),
      },
      this.sampleMedia(),
    );

    if (sameState(previousState, nextState)) return;
    this.state = nextState;
    this.publishStateChanged();
  }

  discontinueTimeline(
    reason: PlaybackTimelineDiscontinuityReason,
    positionMs: number,
    causedByCommandId?: string,
  ): void {
    this.assertStarted();
    if (!isFiniteNonNegative(positionMs)) {
      throw new RangeError("timeline position must be a finite non-negative number");
    }

    this.options.media.seek(positionMs);
    this.publishTimelineDiscontinuity(reason, causedByCommandId);
  }

  publishBootstrap(): void {
    this.emitBootstrap(true);
  }

  private emitBootstrap(reconcileMedia: boolean): void {
    if (!this.started) return;

    const sample = this.sampleMedia();
    if (reconcileMedia) this.state = this.reconcileMediaState(this.requireState(), sample);
    const message: PlaybackBootstrap<TLyrics> = {
      anchor: this.createAnchor(sample),
      authorityId: this.requireAuthorityId(),
      protocolVersion: PLAYBACK_PROTOCOL_VERSION,
      sequence: this.nextSequence(),
      sessionId: this.requireSessionId(),
      state: cloneState(this.requireState()),
      type: "bootstrap",
    };
    this.publish(message);
  }

  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    const existingExecution = this.commandExecutions.get(command.commandId);
    if (existingExecution) return existingExecution;

    const commandEpoch = this.commandEpoch;
    const execution = this.commandTail.then(
      () => this.executeCommand(command, commandEpoch),
      () => this.executeCommand(command, commandEpoch),
    );
    this.commandExecutions.set(command.commandId, execution);
    this.commandTail = execution.then(
      () => undefined,
      () => undefined,
    );
    void execution.finally(() => {
      if (this.commandExecutions.get(command.commandId) === execution) {
        this.commandExecutions.delete(command.commandId);
      }
    });
    return execution;
  }

  private async executeCommand(
    command: PlaybackCommand,
    commandEpoch: number,
  ): Promise<PlaybackCommandReceipt> {
    if (commandEpoch !== this.commandEpoch) {
      return this.unavailable(command, "command-superseded");
    }
    if (!this.started || !this.state?.canControl) {
      return {
        commandId: command.commandId,
        reason: "authority-not-available",
        status: "unavailable",
      };
    }

    try {
      switch (command.type) {
        case "toggle":
          if (this.state.phase === "playing") this.pause();
          else {
            const result = await this.play(commandEpoch);
            if (result !== "played") return this.unavailable(command, result);
          }
          break;
        case "play":
          {
            const result = await this.play(commandEpoch);
            if (result !== "played") return this.unavailable(command, result);
          }
          break;
        case "pause":
          this.pause();
          break;
        case "previous":
          if (!this.options.callbacks?.previous) {
            return this.unavailable(command, "previous-command-not-configured");
          }
          await this.options.callbacks.previous();
          break;
        case "next":
          if (!this.options.callbacks?.next) {
            return this.unavailable(command, "next-command-not-configured");
          }
          await this.options.callbacks.next();
          break;
        case "seek":
          if (!isFiniteNonNegative(command.positionMs)) {
            return this.rejected(command, "invalid-seek-position");
          }
          this.discontinueTimeline("seek", command.positionMs, command.commandId);
          break;
        case "set-volume":
          if (!isValidVolume(command.volume)) {
            return this.rejected(command, "invalid-volume");
          }
          this.updateState({ volume: command.volume });
          this.runNotification(this.options.callbacks?.onVolumeChange, command.volume);
          break;
        case "toggle-like": {
          if (!this.options.callbacks?.toggleLike) {
            return this.unavailable(command, "toggle-like-command-not-configured");
          }
          const liked = await this.options.callbacks.toggleLike();
          if (commandEpoch !== this.commandEpoch) {
            return this.unavailable(command, "command-superseded");
          }
          if (typeof liked === "boolean") this.updateState({ liked });
          break;
        }
      }

      return { commandId: command.commandId, status: "accepted" };
    } catch {
      return this.rejected(command, "command-execution-failed");
    }
  }

  private async play(
    commandEpoch: number,
  ): Promise<"command-superseded" | "played" | "playback-source-unavailable"> {
    try {
      if (this.options.callbacks?.ensureSource) {
        const sourceReady = await this.options.callbacks.ensureSource();
        if (commandEpoch !== this.commandEpoch) return "command-superseded";
        if (!sourceReady) return "playback-source-unavailable";
      }
      await this.options.media.play();
      if (commandEpoch !== this.commandEpoch) return "command-superseded";
      this.transitionPhase("playing");
      return "played";
    } catch (error) {
      if (commandEpoch === this.commandEpoch) this.transitionPhase("paused");
      throw error;
    }
  }

  private pause(): void {
    this.options.media.pause();
    const sample = this.sampleMedia();
    this.transitionPhase(sample.ended ? "ended" : "paused", sample);
  }

  private handleMediaEvent(
    event: Parameters<PlaybackAuthorityOptions["media"]["subscribe"]>[0] extends (
      event: infer TEvent,
    ) => void
      ? TEvent
      : never,
  ): void {
    if (!this.started) return;

    switch (event) {
      case "load-start":
        this.transitionPhase("loading");
        break;
      case "playing":
        this.transitionPhase("playing");
        break;
      case "pause": {
        const sample = this.sampleMedia();
        this.transitionPhase(sample.ended ? "ended" : "paused", sample);
        break;
      }
      case "waiting":
        this.transitionPhase("buffering");
        break;
      case "can-play": {
        const sample = this.sampleMedia();
        this.transitionPhase(sample.ended ? "ended" : sample.paused ? "paused" : "playing", sample);
        break;
      }
      case "ended":
        this.transitionPhase("ended");
        this.runNotification(this.options.callbacks?.onEnded);
        break;
      case "error": {
        const sample = this.sampleMedia();
        this.transitionPhase("error", sample);
        this.runNotification(this.options.callbacks?.onError, sample.errorMessage);
        break;
      }
      case "duration-change": {
        const previousState = this.requireState();
        const sample = this.sampleMedia();
        const nextState = this.reconcileMediaState(previousState, sample);
        if (!sameState(previousState, nextState)) {
          this.state = nextState;
          if (
            nextState.durationMs > 0 &&
            previousState.durationMs > 0 &&
            nextState.durationMs + 1 < previousState.durationMs
          ) {
            this.publishTimelineDiscontinuity("media-correction");
          }
          this.publishStateChanged();
        }
        break;
      }
      case "rate-change":
        this.publishClockAnchor();
        break;
    }
  }

  private transitionPhase(phase: PlaybackPhase, providedSample?: PlaybackMediaSample): void {
    const previousState = this.requireState();
    const phaseChanged = previousState.phase !== phase;
    const nextState = this.reconcileMediaState(
      {
        ...previousState,
        phase,
      },
      providedSample ?? this.sampleMedia(),
    );
    this.state = nextState;

    if (!sameState(previousState, nextState)) this.publishStateChanged();
    if (phaseChanged) {
      this.publishClockAnchor();
      this.runNotification(this.options.callbacks?.onPhaseChange, phase);
    }
  }

  private publishStateChanged(): void {
    if (!this.started) return;

    const sample = this.sampleMedia();
    this.state = this.reconcileMediaState(this.requireState(), sample);
    const message: PlaybackStateChanged<TLyrics> = {
      authorityId: this.requireAuthorityId(),
      protocolVersion: PLAYBACK_PROTOCOL_VERSION,
      sampledAtMs: this.options.clock.nowMs(),
      sequence: this.nextSequence(),
      sessionId: this.requireSessionId(),
      state: cloneState(this.state),
      timelineRevision: this.timelineRevision,
      type: "state-changed",
    };
    this.publish(message);
  }

  private publishClockAnchor(): void {
    if (!this.started) return;

    const sample = this.sampleMedia();
    this.publish({
      anchor: this.createAnchor(sample),
      authorityId: this.requireAuthorityId(),
      protocolVersion: PLAYBACK_PROTOCOL_VERSION,
      sequence: this.nextSequence(),
      sessionId: this.requireSessionId(),
      type: "clock-anchored",
    });
  }

  private publishTimelineDiscontinuity(
    reason: PlaybackTimelineDiscontinuityReason,
    causedByCommandId?: string,
  ): void {
    this.timelineRevision += 1;
    const sample = this.sampleMedia();
    const message: PlaybackTimelineDiscontinued = {
      anchor: this.createAnchor(sample),
      authorityId: this.requireAuthorityId(),
      ...(causedByCommandId ? { causedByCommandId } : {}),
      protocolVersion: PLAYBACK_PROTOCOL_VERSION,
      reason,
      sequence: this.nextSequence(),
      sessionId: this.requireSessionId(),
      type: "timeline-discontinued",
    };
    this.publish(message);
  }

  private createAnchor(sample: PlaybackMediaSample): PlaybackClockAnchor {
    return {
      positionMs: sample.positionMs,
      rate:
        this.state?.phase === "playing" && !sample.paused && !sample.ended
          ? sample.playbackRate
          : 0,
      sampledAtMs: this.options.clock.nowMs(),
      timelineRevision: this.timelineRevision,
    };
  }

  private reconcileMediaState(
    state: PlaybackSessionState<TLyrics>,
    sample: PlaybackMediaSample,
  ): PlaybackSessionState<TLyrics> {
    return {
      ...state,
      durationMs: sample.durationMs || Math.max(0, state.durationMs),
      volume: sample.volume,
    };
  }

  private sampleMedia(): PlaybackMediaSample {
    return sanitiseSample(this.options.media.getSample());
  }

  private publish(message: PlaybackMessage<TLyrics>): void {
    this.options.publish(message);
  }

  private nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  private assertStarted(): void {
    if (!this.started) throw new Error("PlaybackAuthority is not running");
  }

  private requireAuthorityId(): string {
    if (!this.authorityId) throw new Error("PlaybackAuthority has no active authority identity");
    return this.authorityId;
  }

  private requireSessionId(): string {
    if (!this.sessionId) throw new Error("PlaybackAuthority has no active session identity");
    return this.sessionId;
  }

  private requireState(): PlaybackSessionState<TLyrics> {
    if (!this.state) throw new Error("PlaybackAuthority has no active playback state");
    return this.state;
  }

  private unavailable(command: PlaybackCommand, reason: string): PlaybackCommandReceipt {
    return { commandId: command.commandId, reason, status: "unavailable" };
  }

  private rejected(command: PlaybackCommand, reason: string): PlaybackCommandReceipt {
    return { commandId: command.commandId, reason, status: "rejected" };
  }

  private runNotification<TArgs extends unknown[]>(
    callback: ((...args: TArgs) => Promise<void> | void) | undefined,
    ...args: TArgs
  ): void {
    if (!callback) return;
    try {
      void Promise.resolve(callback(...args)).catch(() => undefined);
    } catch {
      // Notification adapters cannot compromise the Authority state machine.
    }
  }
}
