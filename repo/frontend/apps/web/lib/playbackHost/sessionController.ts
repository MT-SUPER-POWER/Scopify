import {
  PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
  type PlaybackCommand,
  type PlaybackCommandReceipt,
  type PlaybackHostControlReceipt,
  type PlaybackHostClientCommand,
  type PlaybackHostMusicQuality,
  type PlaybackHostPlaybackIntent,
  type PlaybackHostQueueCommand,
  type PlaybackHostReplaceSessionCommand,
  type PlaybackHostSessionSnapshot,
  type PlaybackQueueEntry,
  type PlaybackQueueSeed,
  type PlaybackSessionSeed,
  validatePlaybackHostClientCommand,
} from "@mt-super-power/desktop-contract";

import {
  createPlaybackQueue,
  createPlaybackQueueSnapshot,
  type PlaybackQueueSnapshot,
  type PlaybackQueueTransition,
} from "@/lib/player/playbackQueue";
import type { PlaybackQueuePort, PlaybackRuntimeSession } from "@/lib/playbackHost/catalog";
import type { PlaybackSourcePreparation } from "@/lib/playbackHost/runtime";

/**
 * The renderer side of the dedicated Host control channel. The Electron
 * adapter remains deliberately outside this module so this controller is safe
 * to exercise in browser tests.
 */
export interface PlaybackHostControlPort {
  onMessage(listener: (payload: unknown) => void): () => void;
  postMessage(payload: PlaybackHostControlReceipt | PlaybackHostSessionSnapshot): void;
}

/**
 * An opaque rollback capability created by the Host production adapter. It
 * binds Runtime and media-projection state together without exposing either
 * implementation to the pure queue/controller domain.
 */
export interface PlaybackHostSessionRuntimeCheckpoint {
  rollback(): Promise<void>;
}

/**
 * The shared Runtime surface used by Host session control. `createRuntime`
 * receives this controller's one QueuePort, so Runtime callbacks and control
 * messages can never advance separate queue copies.
 */
export interface PlaybackHostSessionRuntimePort<TLyrics = unknown> {
  advanceOnEnded(): Promise<boolean>;
  /** Clears the media session after a valid empty-queue replacement. */
  clearSession(): Promise<void>;
  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt>;
  ensureSource(): Promise<PlaybackSourcePreparation>;
  /** Invalidates the current source and retries it without changing queue identity. */
  refreshSource?(): Promise<PlaybackSourcePreparation>;
  /** Captures Authority + Host projection state before a fallible media transition. */
  captureCheckpoint?():
    PlaybackHostSessionRuntimeCheckpoint | Promise<PlaybackHostSessionRuntimeCheckpoint>;
  seedSession(session: PlaybackRuntimeSession<TLyrics>): Promise<unknown>;
}

export interface PlaybackHostSessionCatalog<TLyrics = unknown> {
  /**
   * The catalog boundary owns source/lyrics-specific session details. It must
   * return a complete Runtime session for the supplied, already-selected queue
   * entry without mutating renderer or Zustand state.
   */
  createRuntimeSession(input: {
    entry: PlaybackQueueEntry;
    intent: PlaybackHostPlaybackIntent;
    positionMs: number;
    quality: PlaybackHostMusicQuality;
    reason: "resume" | "track-change";
    sessionRevision: number;
    sourceLoadRevision: number;
    volume: number;
  }): PlaybackRuntimeSession<TLyrics>;
}

export interface PlaybackHostSessionControllerOptions<TLyrics = unknown> {
  catalog: PlaybackHostSessionCatalog<TLyrics>;
  createRuntime(queue: PlaybackHostSessionQueue<TLyrics>): PlaybackHostSessionRuntimePort<TLyrics>;
  port: PlaybackHostControlPort;
  shuffle?(entries: readonly PlaybackQueueEntry[]): PlaybackQueueEntry[];
}

interface PreparedQueueReplacement<TLyrics> {
  runtimeSession: PlaybackRuntimeSession<TLyrics> | null;
  session: PlaybackSessionSeed;
  snapshot: PlaybackQueueSnapshot<PlaybackQueueEntry>;
  sourceLoadRevision: number;
}

interface PreparedQueueCommand<TLyrics> {
  clearSession: boolean;
  runtimeSession: PlaybackRuntimeSession<TLyrics> | null;
  session: PlaybackSessionSeed;
  snapshot: PlaybackQueueSnapshot<PlaybackQueueEntry>;
  sourceLoadRevision: number;
}

interface PlaybackHostSessionQueueCheckpoint {
  activeSession: PlaybackSessionSeed | null;
  snapshot: PlaybackQueueSnapshot<PlaybackQueueEntry>;
  sourceLoadRevision: number;
}

/**
 * Stateful adapter around the existing pure queue state machine.
 *
 * It is intentionally the sole queue object supplied to both the controller
 * and PlaybackRuntime. A replace command is first converted into an immutable
 * candidate; only a fully convertible candidate can replace the live state.
 */
export class PlaybackHostSessionQueue<TLyrics = unknown> implements PlaybackQueuePort<TLyrics> {
  private activeSession: PlaybackSessionSeed | null = null;
  private sourceLoadRevision = -1;
  private snapshot: PlaybackQueueSnapshot<PlaybackQueueEntry> = emptyQueueSnapshot();

  private readonly queue = createPlaybackQueue<PlaybackQueueEntry>((entries) =>
    this.shuffle(entries),
  );

  constructor(
    private readonly catalog: PlaybackHostSessionCatalog<TLyrics>,
    private readonly shuffle: (entries: readonly PlaybackQueueEntry[]) => PlaybackQueueEntry[] = (
      entries,
    ) => [...entries],
  ) {}

  prepareReplacement(session: PlaybackSessionSeed): PreparedQueueReplacement<TLyrics> {
    const snapshot = queueSnapshotFromSeed(session.queue);
    const entry = snapshot.queue[snapshot.queueIndex];
    if (!entry && snapshot.queue.length > 0) throw new Error("session-has-no-current-track");

    const sourceLoadRevision = this.nextSourceLoadRevision(session.revision);
    const runtimeSession = entry
      ? this.createRuntimeSession({
          entry,
          intent: session.intent,
          positionMs: session.resumePositionMs,
          quality: session.quality,
          reason: session.resumePositionMs > 0 ? "resume" : "track-change",
          sessionRevision: session.revision,
          sourceLoadRevision,
          volume: session.volume,
        })
      : null;

    return {
      runtimeSession,
      session: cloneSessionSeed(session),
      snapshot,
      sourceLoadRevision,
    };
  }

  commitReplacement(replacement: PreparedQueueReplacement<TLyrics>): void {
    this.activeSession = cloneSessionSeed(replacement.session);
    this.snapshot = createPlaybackQueueSnapshot(replacement.snapshot);
    this.sourceLoadRevision = replacement.sourceLoadRevision;
  }

  /**
   * Converts an intent-only client queue command into a fully prepared Host
   * mutation. Nothing live changes until the controller has seeded media,
   * verified its source, and accepted the corresponding playback command.
   */
  prepareQueueCommand(command: PlaybackHostQueueCommand): PreparedQueueCommand<TLyrics> | null {
    const activeSession = this.activeSession;
    if (!activeSession) throw new Error("queue-command-without-active-session");

    const snapshot = this.currentSnapshot();
    const context = { currentTrack: snapshot.queue[snapshot.queueIndex] ?? null };
    let transition: PlaybackQueueTransition<PlaybackQueueEntry>;

    switch (command.type) {
      case "select-queue-index":
        transition = this.queue.playQueueIndex(snapshot, command.index, command.addToHistory);
        break;
      case "replace-queue":
        if (command.queue.length === 0) {
          transition = {
            effect: { type: "clear" },
            snapshot: {
              ...snapshot,
              historyIndex: -1,
              historyStack: [],
              originalQueue: [],
              playlistId: command.playlistId,
              queue: [],
              queueIndex: -1,
            },
          };
          break;
        }
        transition = command.play
          ? this.queue.playFromSong(
              snapshot,
              command.queue[command.startIndex]!,
              command.queue,
              command.playlistId,
            )
          : this.queue.setQueue(snapshot, command.queue, command.startIndex, command.playlistId);
        break;
      case "set-repeat-mode":
        transition = this.queue.setRepeatMode(snapshot, command.repeatMode);
        break;
      case "set-shuffle":
        transition = this.queue.setShuffle(snapshot, command.enabled);
        break;
      case "toggle-shuffle":
        transition = this.queue.toggleShuffle(snapshot);
        break;
      case "reshuffle-queue":
        transition = this.queue.reshuffleQueue(snapshot, context);
        break;
      case "move-queue-item":
        transition = this.queue.moveQueueItem(
          snapshot,
          context,
          command.fromIndex,
          command.toIndex,
        );
        break;
      case "move-queue-item-to-next":
        transition = this.queue.moveQueueItemToNext(snapshot, context, command.index);
        break;
      case "remove-queue-item":
        transition = this.queue.removeQueueItem(snapshot, context, command.index);
        break;
    }

    if (transition.snapshot === snapshot) return null;
    return this.prepareQueueTransition(activeSession, transition);
  }

  commitQueueCommand(command: PreparedQueueCommand<TLyrics>): void {
    this.activeSession = cloneSessionSeed(command.session);
    this.snapshot = createPlaybackQueueSnapshot(command.snapshot);
    this.sourceLoadRevision = command.sourceLoadRevision;
  }

  currentSnapshot(): PlaybackQueueSnapshot<PlaybackQueueEntry> {
    return createPlaybackQueueSnapshot(this.snapshot);
  }

  checkpoint(): PlaybackHostSessionQueueCheckpoint {
    return {
      activeSession: this.activeSession ? cloneSessionSeed(this.activeSession) : null,
      snapshot: createPlaybackQueueSnapshot(this.snapshot),
      sourceLoadRevision: this.sourceLoadRevision,
    };
  }

  restore(checkpoint: PlaybackHostSessionQueueCheckpoint): void {
    this.activeSession = checkpoint.activeSession
      ? cloneSessionSeed(checkpoint.activeSession)
      : null;
    this.snapshot = createPlaybackQueueSnapshot(checkpoint.snapshot);
    this.sourceLoadRevision = checkpoint.sourceLoadRevision;
  }

  sessionSnapshot(): PlaybackSessionSeed | null {
    const session = this.activeSession;
    if (!session) return null;
    return {
      ...cloneSessionSeed(session),
      queue: queueSeedFromSnapshot(this.snapshot),
    };
  }

  /** Applies a canonical Authority state change without touching the Runtime. */
  patchSession(input: {
    intent?: PlaybackHostPlaybackIntent;
    volume?: number;
  }): PlaybackSessionSeed | null {
    const activeSession = this.activeSession;
    if (!activeSession) return null;

    const intent = input.intent ?? activeSession.intent;
    const volume = input.volume === undefined ? activeSession.volume : input.volume / 100;
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) return null;
    if (intent === activeSession.intent && volume === activeSession.volume) return null;

    const session = {
      ...cloneSessionSeed(activeSession),
      intent,
      revision: this.nextSessionRevision(activeSession.revision),
      volume,
    };
    this.activeSession = session;
    return cloneSessionSeed(session);
  }

  /**
   * Stores a coarse resume checkpoint without asking Runtime to reload media or
   * re-select a queue entry. Callers decide when a position is significant
   * enough to checkpoint; this boundary only validates and canonicalizes it.
   */
  patchResumePosition(positionMs: number): PlaybackSessionSeed | null {
    const activeSession = this.activeSession;
    const currentTrack = this.snapshot.queue[this.snapshot.queueIndex];
    if (!activeSession || !currentTrack || !Number.isFinite(positionMs) || positionMs < 0) {
      return null;
    }

    // Track metadata is the authoritative upper bound. A duration of zero is
    // valid for streams whose duration is not yet known, so do not force an
    // artificial max in that case.
    const resumePositionMs =
      Number.isFinite(currentTrack.durationMs) && currentTrack.durationMs > 0
        ? Math.min(positionMs, currentTrack.durationMs)
        : positionMs;
    if (resumePositionMs === activeSession.resumePositionMs) return null;

    const session = {
      ...cloneSessionSeed(activeSession),
      resumePositionMs,
      revision: this.nextSessionRevision(activeSession.revision),
    };
    this.activeSession = session;
    return cloneSessionSeed(session);
  }

  next(reason: "ended" | "manual"): PlaybackRuntimeSession<TLyrics> | null {
    const activeSession = this.activeSession;
    if (!activeSession) return null;

    const transition = this.queue.playNext(
      this.snapshot,
      { currentTrack: this.snapshot.queue[this.snapshot.queueIndex] ?? null },
      reason,
    );
    return this.commitPlayTransition(activeSession, transition);
  }

  previous(): PlaybackRuntimeSession<TLyrics> | null {
    const activeSession = this.activeSession;
    if (!activeSession) return null;

    const transition = this.queue.playPrev(this.snapshot);
    return this.commitPlayTransition(activeSession, transition);
  }

  /**
   * Commits an already-selected queue transition as one new Host session.
   *
   * Queue selection is pure, so all fallible work (revision allocation and
   * catalog conversion) happens before replacing any live state. This keeps a
   * source/session overflow from leaving the Host queue half-transitioned.
   */
  private commitPlayTransition(
    activeSession: PlaybackSessionSeed,
    transition: PlaybackQueueTransition<PlaybackQueueEntry>,
  ): PlaybackRuntimeSession<TLyrics> | null {
    if (transition.effect.type !== "play") return null;

    const sessionRevision = this.nextSessionRevision(activeSession.revision);
    const sourceLoadRevision = this.nextSourceLoadRevision(sessionRevision);
    const snapshot = createPlaybackQueueSnapshot(transition.snapshot);
    const nextSession: PlaybackSessionSeed = {
      ...cloneSessionSeed(activeSession),
      intent: "play",
      queue: queueSeedFromSnapshot(snapshot),
      resumePositionMs: 0,
      revision: sessionRevision,
    };
    const runtimeSession = this.createRuntimeSession({
      entry: transition.effect.track,
      intent: "play",
      positionMs: 0,
      quality: activeSession.quality,
      reason: "track-change",
      sessionRevision,
      sourceLoadRevision,
      volume: activeSession.volume,
    });

    this.snapshot = snapshot;
    this.sourceLoadRevision = sourceLoadRevision;
    this.activeSession = nextSession;
    return runtimeSession;
  }

  private prepareQueueTransition(
    activeSession: PlaybackSessionSeed,
    transition: PlaybackQueueTransition<PlaybackQueueEntry>,
  ): PreparedQueueCommand<TLyrics> {
    const sessionRevision = this.nextSessionRevision(activeSession.revision);
    const snapshot = createPlaybackQueueSnapshot(transition.snapshot);
    const playEffect = transition.effect.type === "play" ? transition.effect : null;
    const shouldLoadTrack = playEffect !== null;
    const clearSession = transition.effect.type === "clear";
    const sourceLoadRevision = shouldLoadTrack
      ? this.nextSourceLoadRevision(sessionRevision)
      : this.sourceLoadRevision;
    const session: PlaybackSessionSeed = {
      ...cloneSessionSeed(activeSession),
      intent: shouldLoadTrack ? "play" : clearSession ? "pause" : activeSession.intent,
      queue: queueSeedFromSnapshot(snapshot),
      resumePositionMs: shouldLoadTrack || clearSession ? 0 : activeSession.resumePositionMs,
      revision: sessionRevision,
    };
    const runtimeSession = shouldLoadTrack
      ? this.createRuntimeSession({
          entry: playEffect.track,
          intent: "play",
          positionMs: 0,
          quality: activeSession.quality,
          reason: "track-change",
          sessionRevision,
          sourceLoadRevision,
          volume: activeSession.volume,
        })
      : null;

    return { clearSession, runtimeSession, session, snapshot, sourceLoadRevision };
  }

  private createRuntimeSession(
    input: Parameters<PlaybackHostSessionCatalog<TLyrics>["createRuntimeSession"]>[0],
  ) {
    const session = this.catalog.createRuntimeSession(input);
    if (!session.key || session.sourceLoadRevision !== input.sourceLoadRevision) {
      throw new Error("catalog-returned-an-invalid-runtime-session");
    }
    return session;
  }

  private nextSourceLoadRevision(sessionRevision: number): number {
    const candidate = Math.max(this.sourceLoadRevision + 1, sessionRevision);
    if (!Number.isSafeInteger(candidate) || candidate < 0) {
      throw new RangeError("playback-host-source-load-revision-exhausted");
    }
    return candidate;
  }

  private nextSessionRevision(currentRevision: number): number {
    const candidate = currentRevision + 1;
    if (!Number.isSafeInteger(candidate) || candidate < 0) {
      throw new RangeError("playback-host-session-revision-exhausted");
    }
    return candidate;
  }
}

/** A transport-bound application service for strict Host replace-session commands. */
export class PlaybackHostSessionController<TLyrics = unknown> {
  readonly queue: PlaybackHostSessionQueue<TLyrics>;

  private currentRevision: number | null = null;
  private commandSequence = 0;
  private commandTail: Promise<void> = Promise.resolve();
  private readonly runtime: PlaybackHostSessionRuntimePort<TLyrics>;

  constructor(private readonly options: PlaybackHostSessionControllerOptions<TLyrics>) {
    this.queue = new PlaybackHostSessionQueue(options.catalog, options.shuffle);
    this.runtime = options.createRuntime(this.queue);
  }

  /** Starts receiving commands. Calling this more than once is harmless. */
  connect(): () => void {
    return this.options.port.onMessage((payload) => {
      void this.handlePayload(payload);
    });
  }

  async handlePayload(payload: unknown): Promise<PlaybackHostControlReceipt | null> {
    const validation = validatePlaybackHostClientCommand(payload);
    if (!validation.success) return null;

    return this.enqueue(() =>
      validation.command.type === "replace-session"
        ? this.applyReplacement(validation.command)
        : this.applyQueueCommand(validation.command),
    );
  }

  /**
   * Called by the Authority's media-ended callback. The Runtime drives the
   * exact same QueuePort owned above, which yields a fresh Runtime session and
   * therefore a new Authority/session feature identity and source-load epoch.
   */
  async handleEnded(): Promise<boolean> {
    return this.enqueue(async () => {
      const advanced = await this.applyQueueTransition(() => this.runtime.advanceOnEnded());
      if (advanced) return true;

      return this.pauseAfterPlaybackStop();
    });
  }

  /** Advances the Host-owned queue for an explicit next-track action. */
  async handleNext(): Promise<boolean> {
    return this.enqueue(() =>
      this.applyQueueTransition(async () => {
        const session = this.queue.next("manual");
        if (!session) return false;
        await this.runtime.seedSession(session);
        return true;
      }),
    );
  }

  /** Rewinds the Host-owned queue for an explicit previous-track action. */
  async handlePrevious(): Promise<boolean> {
    return this.enqueue(() =>
      this.applyQueueTransition(async () => {
        const session = this.queue.previous();
        if (!session) return false;
        await this.runtime.seedSession(session);
        return true;
      }),
    );
  }

  /**
   * Recovers an active media error without falling back to Host-local Zustand
   * actions. First retry the same entry with catalog invalidation; only then
   * move the one canonical queue to its next candidate. If there is no usable
   * candidate, publish a paused canonical session instead of leaving `play`
   * intent attached to a failed media element.
   */
  async handleMediaError(): Promise<boolean> {
    return this.enqueue(async () => {
      const refreshed = this.runtime.refreshSource ? await this.runtime.refreshSource() : "failed";
      if (refreshed === "ready") {
        const receipt = await this.runtime.dispatch(this.createIntentCommand("play"));
        if (receipt.status === "accepted") return true;
      }

      const advanced = await this.applyQueueTransition(async () => {
        // A recovery fallback is automatic progression, not a user request to
        // restart an exhausted queue. It must keep the same stop-at-tail
        // semantics as a natural ended event.
        const session = this.queue.next("ended");
        if (!session) return false;
        await this.runtime.seedSession(session);
        return true;
      });
      if (advanced) return true;

      return this.pauseAfterPlaybackStop();
    });
  }

  /**
   * Receives the small subset of Authority state that belongs in the canonical
   * session. `volume` is the Authority's public 0..100 percentage; the wire
   * seed stores it normalized to 0..1.
   */
  async updatePlaybackState(input: {
    intent?: PlaybackHostPlaybackIntent;
    volume?: number;
  }): Promise<boolean> {
    return this.enqueue(async () => {
      let session: PlaybackSessionSeed | null;
      try {
        session = this.queue.patchSession(input);
      } catch {
        return false;
      }
      if (!session || !isNewerRevision(session.revision, this.currentRevision)) return false;

      this.currentRevision = session.revision;
      this.post({
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        session,
        type: "session-snapshot",
      });
      return true;
    });
  }

  /**
   * Persists a caller-throttled resume checkpoint. It never invokes Runtime,
   * source resolution, or queue transition logic.
   */
  async updateResumePosition(positionMs: number): Promise<boolean> {
    return this.enqueue(async () => {
      let session: PlaybackSessionSeed | null;
      try {
        session = this.queue.patchResumePosition(positionMs);
      } catch {
        return false;
      }
      if (!session || !isNewerRevision(session.revision, this.currentRevision)) return false;

      this.currentRevision = session.revision;
      this.post({
        protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
        session,
        type: "session-snapshot",
      });
      return true;
    });
  }

  /**
   * Ignores transient media phases; only durable intent transitions synchronize.
   *
   * `ended` deliberately does not advance here. Authority emits both its phase
   * notification and its dedicated ended callback for one media event, and the
   * latter is the single owner of queue progression.
   */
  async handlePhaseChange(phase: "ended" | "error" | "paused" | "playing"): Promise<boolean> {
    if (phase === "ended") return false;
    return this.updatePlaybackState({ intent: phase === "playing" ? "play" : "pause" });
  }

  sessionSnapshot(): PlaybackHostSessionSnapshot | null {
    const session = this.queue.sessionSnapshot();
    if (!session) return null;
    return {
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      session,
      type: "session-snapshot",
    };
  }

  private async applyReplacement(
    command: PlaybackHostReplaceSessionCommand,
  ): Promise<PlaybackHostControlReceipt> {
    if (this.currentRevision !== null && command.session.revision <= this.currentRevision) {
      return this.reject(command, "stale-session-revision");
    }

    let replacement: PreparedQueueReplacement<TLyrics>;
    try {
      // No live queue mutation happens before this full wire-to-domain conversion succeeds.
      replacement = this.queue.prepareReplacement(command.session);
    } catch (error) {
      return this.reject(command, errorReason(error, "session-conversion-failed"));
    }

    const checkpoint = await this.captureRuntimeCheckpoint();
    try {
      if (replacement.runtimeSession) {
        await this.runtime.seedSession(replacement.runtimeSession);
        const source = await this.runtime.ensureSource();
        if (source !== "ready") {
          await this.rollbackRuntime(checkpoint);
          return this.reject(command, `playback-source-${source}`);
        }

        const playbackReceipt = await this.runtime.dispatch(
          this.createIntentCommand(command.session.intent),
        );
        if (playbackReceipt.status !== "accepted") {
          await this.rollbackRuntime(checkpoint);
          return this.reject(command, `playback-command-${playbackReceipt.status}`);
        }
      } else {
        await this.runtime.clearSession();
      }
    } catch {
      await this.rollbackRuntime(checkpoint);
      return this.reject(command, "playback-session-application-failed");
    }

    this.queue.commitReplacement(replacement);
    this.currentRevision = command.session.revision;

    const receipt: PlaybackHostControlReceipt = {
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: command.session.revision,
      status: "applied",
      type: "command-receipt",
    };
    this.post(receipt);

    const snapshot = this.sessionSnapshot();
    if (snapshot) this.post(snapshot);
    return receipt;
  }

  /** Applies one client queue intent as an atomic Host session mutation. */
  private async applyQueueCommand(
    command: PlaybackHostQueueCommand,
  ): Promise<PlaybackHostControlReceipt> {
    let prepared: PreparedQueueCommand<TLyrics> | null;
    try {
      prepared = this.queue.prepareQueueCommand(command);
    } catch (error) {
      return this.reject(command, errorReason(error, "queue-command-preparation-failed"));
    }
    if (!prepared) return this.reject(command, "queue-command-no-state-change");

    const checkpoint = await this.captureRuntimeCheckpoint();
    try {
      if (prepared.runtimeSession) {
        await this.runtime.seedSession(prepared.runtimeSession);
        const source = await this.runtime.ensureSource();
        if (source !== "ready") {
          await this.rollbackRuntime(checkpoint);
          return this.reject(command, `playback-source-${source}`);
        }

        const playbackReceipt = await this.runtime.dispatch(this.createIntentCommand("play"));
        if (playbackReceipt.status !== "accepted") {
          await this.rollbackRuntime(checkpoint);
          return this.reject(command, `playback-command-${playbackReceipt.status}`);
        }
      } else if (prepared.clearSession) {
        await this.runtime.clearSession();
      }
    } catch {
      await this.rollbackRuntime(checkpoint);
      return this.reject(command, "playback-queue-command-application-failed");
    }

    this.queue.commitQueueCommand(prepared);
    this.currentRevision = prepared.session.revision;
    const receipt: PlaybackHostControlReceipt = {
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      revision: prepared.session.revision,
      status: "applied",
      type: "command-receipt",
    };
    this.post(receipt);
    const snapshot = this.sessionSnapshot();
    if (snapshot) this.post(snapshot);
    return receipt;
  }

  /**
   * Completes a queue transition only after the new runtime session is
   * playable and its play command was accepted. The queue advances before the
   * runtime asks for media (Runtime needs this one QueuePort), but a failed
   * transition deliberately emits no snapshot: consumers never observe an
   * unplayable candidate as authoritative state.
   */
  private async applyQueueTransition(advance: () => Promise<boolean>): Promise<boolean> {
    const previousRevision = this.currentRevision;
    const checkpoint = this.queue.checkpoint();
    const runtimeCheckpoint = await this.captureRuntimeCheckpoint();

    try {
      const advanced = await advance();
      if (!advanced) {
        await this.rollbackRuntime(runtimeCheckpoint);
        return false;
      }

      const snapshot = this.sessionSnapshot();
      if (!snapshot || !isNewerRevision(snapshot.session.revision, previousRevision)) {
        this.queue.restore(checkpoint);
        await this.rollbackRuntime(runtimeCheckpoint);
        return false;
      }

      const source = await this.runtime.ensureSource();
      if (source !== "ready") {
        this.queue.restore(checkpoint);
        await this.rollbackRuntime(runtimeCheckpoint);
        return false;
      }

      const receipt = await this.runtime.dispatch(this.createIntentCommand("play"));
      if (receipt.status !== "accepted") {
        this.queue.restore(checkpoint);
        await this.rollbackRuntime(runtimeCheckpoint);
        return false;
      }

      // The session revision changes for every Host queue transition. Updating
      // it before posting makes a later client replace with the old revision
      // unambiguously stale, even if messages race on reconnect.
      this.currentRevision = snapshot.session.revision;
      this.post(snapshot);
      return true;
    } catch {
      this.queue.restore(checkpoint);
      await this.rollbackRuntime(runtimeCheckpoint);
      return false;
    }
  }

  /**
   * A terminal end or an exhausted recovery has no subsequent runtime session.
   * Persisting pause here prevents a later control-channel reconnect from
   * replaying the old session solely because its durable intent remained play.
   */
  private pauseAfterPlaybackStop(): boolean {
    let session: PlaybackSessionSeed | null;
    try {
      session = this.queue.patchSession({ intent: "pause" });
    } catch {
      return false;
    }
    if (!session || !isNewerRevision(session.revision, this.currentRevision)) return false;

    this.currentRevision = session.revision;
    this.post({
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      session,
      type: "session-snapshot",
    });
    return false;
  }

  private createIntentCommand(intent: PlaybackHostPlaybackIntent): PlaybackCommand {
    this.commandSequence += 1;
    const commandId = `playback-host-${this.commandSequence}`;
    return intent === "play" ? { commandId, type: "play" } : { commandId, type: "pause" };
  }

  private async captureRuntimeCheckpoint(): Promise<PlaybackHostSessionRuntimeCheckpoint | null> {
    try {
      return (await this.runtime.captureCheckpoint?.()) ?? null;
    } catch {
      // The pure controller still supports compatibility adapters without
      // rollback. Production Host adapters always provide the capability.
      return null;
    }
  }

  private async rollbackRuntime(
    checkpoint: PlaybackHostSessionRuntimeCheckpoint | null,
  ): Promise<void> {
    if (!checkpoint) return;
    try {
      await checkpoint.rollback();
    } catch {
      // Preserve the canonical queue rollback even if an Authority is already
      // unavailable during renderer teardown.
    }
  }

  private reject(
    command: Pick<PlaybackHostClientCommand, "commandId">,
    reason: string,
  ): PlaybackHostControlReceipt {
    const receipt: PlaybackHostControlReceipt = {
      commandId: command.commandId,
      protocolVersion: PLAYBACK_HOST_CONTROL_PROTOCOL_VERSION,
      reason,
      revision: this.currentRevision ?? 0,
      status: "rejected",
      type: "command-receipt",
    };
    this.post(receipt);
    return receipt;
  }

  private enqueue<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const result = this.commandTail.then(operation, operation);
    this.commandTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private post(payload: PlaybackHostControlReceipt | PlaybackHostSessionSnapshot): void {
    try {
      this.options.port.postMessage(payload);
    } catch {
      // A disconnected control client must not roll back an already-applied Host session.
    }
  }
}

export function createPlaybackHostSessionController<TLyrics = unknown>(
  options: PlaybackHostSessionControllerOptions<TLyrics>,
): PlaybackHostSessionController<TLyrics> {
  return new PlaybackHostSessionController(options);
}

function emptyQueueSnapshot(): PlaybackQueueSnapshot<PlaybackQueueEntry> {
  return {
    historyIndex: -1,
    historyStack: [],
    isShuffle: false,
    originalQueue: [],
    playlistId: null,
    queue: [],
    queueIndex: -1,
    repeatMode: "off",
  };
}

function queueSnapshotFromSeed(seed: PlaybackQueueSeed): PlaybackQueueSnapshot<PlaybackQueueEntry> {
  return {
    historyIndex: seed.historyIndex,
    historyStack: [...seed.historyStack],
    isShuffle: seed.shuffleEnabled,
    originalQueue: seed.originalQueue.map(cloneQueueEntry),
    playlistId: seed.playlistId,
    queue: seed.queue.map(cloneQueueEntry),
    queueIndex: seed.queueIndex,
    repeatMode: seed.repeatMode,
  };
}

function queueSeedFromSnapshot(
  snapshot: PlaybackQueueSnapshot<PlaybackQueueEntry>,
): PlaybackQueueSeed {
  return {
    historyIndex: snapshot.historyIndex,
    historyStack: [...snapshot.historyStack],
    originalQueue: snapshot.originalQueue.map(cloneQueueEntry),
    playlistId: snapshot.playlistId,
    queue: snapshot.queue.map(cloneQueueEntry),
    queueIndex: snapshot.queueIndex,
    repeatMode: snapshot.repeatMode,
    shuffleEnabled: snapshot.isShuffle,
  };
}

function cloneSessionSeed(session: PlaybackSessionSeed): PlaybackSessionSeed {
  return {
    ...session,
    queue: queueSeedFromSnapshot(queueSnapshotFromSeed(session.queue)),
  };
}

function cloneQueueEntry(entry: PlaybackQueueEntry): PlaybackQueueEntry {
  return {
    ...entry,
    ...(entry.alias ? { alias: [...entry.alias] } : {}),
    album: { ...entry.album },
    artists: entry.artists.map((artist) => ({ ...artist })),
  };
}

function errorReason(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

function isNewerRevision(candidate: number, previous: number | null): boolean {
  return previous === null || candidate > previous;
}
