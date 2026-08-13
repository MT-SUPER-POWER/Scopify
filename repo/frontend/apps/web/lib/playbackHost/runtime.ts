import type {
  PlaybackCommand,
  PlaybackCommandReceipt,
  PlaybackSessionState,
} from "@scopifymusicplayer/desktop-contract";
import { PLAYBACK_VOLUME_MAX } from "@scopifymusicplayer/desktop-contract";

import type {
  PlaybackCatalogPort,
  PlaybackQueuePort,
  PlaybackRuntimeSession,
  PlaybackSourceRequest,
} from "@/lib/playbackHost/catalog";
import type {
  PlaybackFeatureIdentity,
  PlaybackFeaturePublisher,
} from "@/lib/playbackHost/audioFeatureSampler";

/**
 * A narrow adapter around the existing PlaybackAuthority and its projection
 * transport. The Runtime coordinates lifecycle and source supersession; the
 * Authority continues to own protocol state, media events and command rules.
 */
export interface PlaybackRuntimeAuthorityPort<TLyrics = unknown> {
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  seedSession(
    state: PlaybackSessionState<TLyrics>,
    options: {
      positionMs: number;
      reason: "replay" | "resume" | "track-change";
    },
  ): PlaybackFeatureIdentity | Promise<PlaybackFeatureIdentity>;
  start(
    state: PlaybackSessionState<TLyrics>,
  ): PlaybackFeatureIdentity | Promise<PlaybackFeatureIdentity>;
  stop(): void;
}

export interface PlaybackRuntimeOptions<TLyrics = unknown> {
  authority: PlaybackRuntimeAuthorityPort<TLyrics>;
  catalog: PlaybackCatalogPort<TLyrics>;
  featurePublisher: PlaybackFeaturePublisher;
  queue: PlaybackQueuePort<TLyrics>;
}

export type PlaybackSourcePreparation = "failed" | "ready" | "superseded";

/**
 * A rollback point for one Host media transaction. It intentionally captures
 * Runtime-owned state only; the Host adapter pairs it with its projection
 * checkpoint so neither layer learns about the other's storage.
 */
export interface PlaybackRuntimeCheckpoint<TLyrics = unknown> {
  activeSession: PlaybackRuntimeSession<TLyrics> | null;
  lastKnownVolume: number;
}

/**
 * One renderer-neutral playback owner.
 *
 * It has intentionally only four lifecycle operations: start one Authority,
 * seed a new media session, route commands, and stop. Browser and dedicated
 * hidden-window adapters can share this module without sharing React or
 * Zustand state.
 */
export class PlaybackRuntime<TLyrics = unknown> {
  private activeSession: PlaybackRuntimeSession<TLyrics> | null = null;
  private lastKnownVolume: number = PLAYBACK_VOLUME_MAX;
  private sourceLoadEpoch = 0;
  private started = false;

  constructor(private readonly options: PlaybackRuntimeOptions<TLyrics>) {}

  async start(session: PlaybackRuntimeSession<TLyrics>): Promise<PlaybackFeatureIdentity> {
    if (this.started) throw new Error("Playback Runtime is already running");
    assertSession(session);

    const identity = await this.options.authority.start(session.state);
    assertIdentity(identity);
    this.started = true;
    this.activeSession = session;
    this.lastKnownVolume = session.state.volume;
    this.invalidateSourceLoad();
    this.options.featurePublisher.setIdentity(identity);
    return identity;
  }

  async seedSession(session: PlaybackRuntimeSession<TLyrics>): Promise<PlaybackFeatureIdentity> {
    this.assertStarted();
    assertSession(session);

    this.invalidateSourceLoad();
    this.cancelSource();

    const identity = await this.options.authority.seedSession(session.state, {
      positionMs: session.positionMs ?? 0,
      reason: session.reason ?? "track-change",
    });
    assertIdentity(identity);
    this.activeSession = session;
    this.lastKnownVolume = session.state.volume;
    this.options.featurePublisher.setIdentity(identity);
    return identity;
  }

  /**
   * Dispatches through the Authority, except next/previous which choose a
   * concrete session first. Play-like commands wait for a current source;
   * stale async catalog work is rejected before it reaches the Authority.
   */
  async dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    if (!this.started) return unavailable(command, "playback-runtime-not-running");

    switch (command.type) {
      case "next":
        return this.advance(command, "manual");
      case "previous":
        return this.rewind(command);
      case "play":
      case "toggle": {
        const preparation = await this.ensureSource();
        if (preparation !== "ready") {
          return unavailable(
            command,
            preparation === "superseded"
              ? "playback-source-superseded"
              : "playback-source-unavailable",
          );
        }
        return this.options.authority.dispatch(command);
      }
      default: {
        const receipt = await this.options.authority.dispatch(command);
        if (command.type === "set-volume" && receipt.status === "accepted") {
          this.lastKnownVolume = command.volume;
        }
        return receipt;
      }
    }
  }

  /** Used by the Authority's ended callback without manufacturing a wire command. */
  async advanceOnEnded(): Promise<boolean> {
    if (!this.started) return false;
    const session = await this.options.queue.next("ended");
    if (!session) return false;
    await this.seedSession(session);
    return true;
  }

  /**
   * Keeps the Authority and its transport alive while representing a valid
   * empty queue. Pending source resolution is invalidated before the idle
   * session is published, so a stale URL cannot revive the removed track.
   */
  async clearSession(): Promise<void> {
    this.assertStarted();

    this.activeSession = null;
    this.invalidateSourceLoad();
    this.cancelSource();
    this.options.featurePublisher.setIdentity(null);
    await this.options.authority.seedSession(
      createIdleSessionState<TLyrics>(this.lastKnownVolume),
      {
        positionMs: 0,
        reason: "track-change",
      },
    );
  }

  /**
   * Forces the catalog to discard the active source before requesting it again.
   * Its own load epoch makes an old in-flight resolve unable to revive a failed
   * URL after the retry begins.
   */
  async refreshSource(): Promise<PlaybackSourcePreparation> {
    if (!this.started || !this.activeSession) return "failed";

    const session = this.activeSession;
    const invalidationEpoch = this.sourceLoadEpoch + 1;
    this.sourceLoadEpoch = invalidationEpoch;
    const request: PlaybackSourceRequest<TLyrics> = {
      loadEpoch: invalidationEpoch,
      session,
      sourceLoadRevision: session.sourceLoadRevision,
    };

    try {
      await this.options.catalog.invalidateSource?.(request);
    } catch {
      return "failed";
    }

    if (!this.isCurrentSourceRequest(request)) return "superseded";
    return this.ensureSource();
  }

  /** Captures the currently committed Authority session before a Host transition. */
  checkpoint(): PlaybackRuntimeCheckpoint<TLyrics> {
    return {
      activeSession: this.activeSession ? cloneRuntimeSession(this.activeSession) : null,
      lastKnownVolume: this.lastKnownVolume,
    };
  }

  /**
   * Restores a previously committed Authority state after a candidate source
   * or command fails. Cancelling first is essential: the failed candidate may
   * still be resolving asynchronously while the old session is re-projected.
   */
  async restore(checkpoint: PlaybackRuntimeCheckpoint<TLyrics>): Promise<void> {
    this.assertStarted();
    this.activeSession = null;
    this.lastKnownVolume = checkpoint.lastKnownVolume;
    this.invalidateSourceLoad();
    this.cancelSource();

    const session = checkpoint.activeSession;
    if (!session) {
      this.options.featurePublisher.setIdentity(null);
      await this.options.authority.seedSession(
        createIdleSessionState<TLyrics>(this.lastKnownVolume),
        {
          positionMs: 0,
          reason: "track-change",
        },
      );
      return;
    }

    const identity = await this.options.authority.seedSession(session.state, {
      positionMs: session.positionMs ?? 0,
      reason: session.reason ?? "track-change",
    });
    assertIdentity(identity);
    this.activeSession = cloneRuntimeSession(session);
    this.lastKnownVolume = session.state.volume;
    this.options.featurePublisher.setIdentity(identity);
  }

  /**
   * Source preparation is public so an Authority callback can reuse the exact
   * same epoch guard during the in-page compatibility phase.
   */
  async ensureSource(): Promise<PlaybackSourcePreparation> {
    if (!this.started || !this.activeSession) return "failed";

    const session = this.activeSession;
    const loadEpoch = this.sourceLoadEpoch + 1;
    this.sourceLoadEpoch = loadEpoch;
    const request: PlaybackSourceRequest<TLyrics> = {
      loadEpoch,
      session,
      sourceLoadRevision: session.sourceLoadRevision,
    };

    let ready: boolean;
    try {
      ready = await this.options.catalog.ensureSource(request);
    } catch {
      ready = false;
    }

    if (!this.isCurrentSourceRequest(request)) return "superseded";
    return ready ? "ready" : "failed";
  }

  stop(): void {
    if (!this.started) return;

    this.started = false;
    this.activeSession = null;
    this.invalidateSourceLoad();
    this.cancelSource();
    this.options.featurePublisher.setIdentity(null);
    try {
      this.options.authority.stop();
    } finally {
      this.options.featurePublisher.stop?.();
    }
  }

  private async advance(
    command: PlaybackCommand,
    reason: "manual",
  ): Promise<PlaybackCommandReceipt> {
    const session = await this.options.queue.next(reason);
    if (!session) return unavailable(command, "playback-queue-next-unavailable");

    await this.seedSession(session);
    return accepted(command);
  }

  private async rewind(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    const session = await this.options.queue.previous();
    if (!session) return unavailable(command, "playback-queue-previous-unavailable");

    await this.seedSession(session);
    return accepted(command);
  }

  private invalidateSourceLoad(): void {
    this.sourceLoadEpoch += 1;
  }

  private cancelSource(): void {
    try {
      this.options.catalog.cancelSource?.();
    } catch {
      // Cancellation is a best-effort safety fence. The Runtime epoch remains
      // authoritative even if a third-party catalog implementation throws.
    }
  }

  private isCurrentSourceRequest(request: PlaybackSourceRequest<TLyrics>): boolean {
    return (
      this.started &&
      this.activeSession?.key === request.session.key &&
      this.activeSession.sourceLoadRevision === request.sourceLoadRevision &&
      this.sourceLoadEpoch === request.loadEpoch
    );
  }

  private assertStarted(): void {
    if (!this.started) throw new Error("Playback Runtime is not running");
  }
}

function cloneRuntimeSession<TLyrics>(
  session: PlaybackRuntimeSession<TLyrics>,
): PlaybackRuntimeSession<TLyrics> {
  return {
    ...session,
    state: { ...session.state },
  };
}

export function createPlaybackRuntime<TLyrics = unknown>(
  options: PlaybackRuntimeOptions<TLyrics>,
): PlaybackRuntime<TLyrics> {
  return new PlaybackRuntime(options);
}

function accepted(command: PlaybackCommand): PlaybackCommandReceipt {
  return { commandId: command.commandId, status: "accepted" };
}

function unavailable(command: PlaybackCommand, reason: string): PlaybackCommandReceipt {
  return { commandId: command.commandId, reason, status: "unavailable" };
}

function assertIdentity(identity: PlaybackFeatureIdentity): void {
  if (!identity.authorityId || !identity.sessionId) {
    throw new Error("Playback Authority returned an incomplete feature identity");
  }
}

function assertSession<TLyrics>(session: PlaybackRuntimeSession<TLyrics>): void {
  if (!session.key) throw new Error("Playback Runtime session needs a key");
  if (!Number.isSafeInteger(session.sourceLoadRevision) || session.sourceLoadRevision < 0) {
    throw new RangeError(
      "Playback Runtime source load revision must be a non-negative safe integer",
    );
  }
  if (
    session.positionMs !== undefined &&
    (!Number.isFinite(session.positionMs) || session.positionMs < 0)
  ) {
    throw new RangeError("Playback Runtime session position must be finite and non-negative");
  }
}

function createIdleSessionState<TLyrics>(volume: number): PlaybackSessionState<TLyrics> {
  return {
    canControl: false,
    durationMs: 0,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "idle",
    track: null,
    volume,
  };
}
