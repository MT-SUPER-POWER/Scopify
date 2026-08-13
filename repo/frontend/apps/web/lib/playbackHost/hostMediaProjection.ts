import type { PlaybackCommand, PlaybackCommandReceipt } from "@scopifymusicplayer/desktop-contract";

import type { PlaybackRuntimeSession } from "@/lib/playbackHost/catalog";
import type {
  PlaybackRuntimeAuthorityPort,
  PlaybackSourcePreparation,
} from "@/lib/playbackHost/runtime";
import type {
  PlaybackHostAuthorityBinding,
  PlaybackHostAuthorityPortProxy,
  PlaybackHostEndedPort,
  PlaybackHostMediaProjectionPort,
  PlaybackHostMediaProjectionTransaction,
  PlaybackHostResolvedSourceProjectionInput,
  PlaybackHostRuntimeSessionProjectionInput,
} from "@/types/playbackHostMediaProjection";

interface ActiveSession<TLyrics> extends PlaybackHostRuntimeSessionProjectionInput<TLyrics> {
  durationMs: number;
  lyrics: TLyrics | null;
  sourceUrl: string | null;
}

/** Opaque Host projection rollback point paired with a Runtime checkpoint. */
export interface PlaybackHostMediaProjectionCheckpoint<TLyrics = unknown> {
  active: ActiveSession<TLyrics> | null;
}

/**
 * Maps Runtime and Catalog material into one transaction for the Host's Player
 * and Time projections. It deliberately knows neither Zustand nor React.
 *
 * A source result is admitted only if both its session key and source-load
 * revision still equal the last accepted Runtime session. This is the final
 * local stale guard after the catalog's AbortSignal/sequence guard.
 */
export class PlaybackHostMediaProjectionService<TLyrics = unknown> {
  private active: ActiveSession<TLyrics> | null = null;

  constructor(private readonly port: PlaybackHostMediaProjectionPort<TLyrics>) {}

  applyRuntimeSession(input: PlaybackHostRuntimeSessionProjectionInput<TLyrics>): boolean {
    assertSession(input.session);
    const active = this.active;

    if (
      active &&
      (input.session.sourceLoadRevision < active.session.sourceLoadRevision ||
        (input.session.sourceLoadRevision === active.session.sourceLoadRevision &&
          input.session.key !== active.session.key))
    ) {
      return false;
    }

    const next: ActiveSession<TLyrics> = {
      ...input,
      durationMs: input.session.state.durationMs,
      lyrics: input.session.state.lyrics,
      sourceUrl: null,
    };
    this.port.apply(toTransaction(next));
    this.active = next;
    return true;
  }

  /** Applies URL, lyrics and duration together once the catalog request is current. */
  applyResolvedSource(input: PlaybackHostResolvedSourceProjectionInput<TLyrics>): boolean {
    if (input.isCurrent && !input.isCurrent()) return false;

    const active = this.active;
    if (
      !active ||
      !matchesActiveSession(active, input.request.session, input.request.sourceLoadRevision)
    ) {
      return false;
    }

    // A request whose own copy disagrees is malformed rather than merely stale.
    if (input.request.session.sourceLoadRevision !== input.request.sourceLoadRevision) {
      return false;
    }

    const next: ActiveSession<TLyrics> = {
      ...active,
      durationMs: input.resolved.durationMs,
      lyrics: input.resolved.lyrics,
      sourceUrl: input.resolved.sourceUrl,
    };
    this.port.apply(toTransaction(next));
    this.active = next;
    return true;
  }

  /** Exposes exactly the guard-compatible shape consumed by createPlaybackCatalogPort. */
  applyCatalogResolvedSource(input: PlaybackHostResolvedSourceProjectionInput<TLyrics>): boolean {
    return this.applyResolvedSource(input);
  }

  isCurrent(request: Pick<PlaybackRuntimeSession<TLyrics>, "key" | "sourceLoadRevision">): boolean {
    return Boolean(
      this.active && matchesActiveSession(this.active, request, request.sourceLoadRevision),
    );
  }

  currentSessionKey(): string | null {
    return this.active?.session.key ?? null;
  }

  currentSourceLoadRevision(): number | null {
    return this.active?.session.sourceLoadRevision ?? null;
  }

  checkpoint(): PlaybackHostMediaProjectionCheckpoint<TLyrics> {
    return { active: this.active ? cloneActiveSession(this.active) : null };
  }

  /** Re-applies the last committed projection atomically after a failed transition. */
  restore(checkpoint: PlaybackHostMediaProjectionCheckpoint<TLyrics>): void {
    this.active = checkpoint.active ? cloneActiveSession(checkpoint.active) : null;
    if (this.active) this.port.apply(toTransaction(this.active));
  }

  /** Drops stale-session admission state; the adapter owns any empty UI projection. */
  clear(): void {
    this.active = null;
  }
}

/** Creates a store-neutral media/session projection service. */
export function createPlaybackHostMediaProjection<TLyrics = unknown>(
  port: PlaybackHostMediaProjectionPort<TLyrics>,
): PlaybackHostMediaProjectionService<TLyrics> {
  return new PlaybackHostMediaProjectionService(port);
}

/**
 * A deferred Runtime Authority port. Host control can construct its Runtime
 * before React has mounted the audio Authority; a later bind atomically swaps
 * in the real implementation without importing either React or Zustand here.
 */
export class DeferredPlaybackHostAuthorityPort<
  TLyrics = unknown,
> implements PlaybackHostAuthorityPortProxy<TLyrics> {
  private binding: PlaybackHostAuthorityBinding<TLyrics> | null = null;

  bind(binding: PlaybackHostAuthorityBinding<TLyrics>): () => void {
    this.binding = binding;
    return () => {
      if (this.binding === binding) this.binding = null;
    };
  }

  dispatch(command: PlaybackCommand): Promise<PlaybackCommandReceipt> {
    const binding = this.binding;
    if (!binding) return Promise.resolve(unavailable(command));
    return binding.dispatch(command);
  }

  ensureSource(): Promise<PlaybackSourcePreparation> {
    const binding = this.binding;
    return Promise.resolve(binding ? binding.ensureSource() : "failed");
  }

  isBound(): boolean {
    return this.binding !== null;
  }

  seedSession: PlaybackRuntimeAuthorityPort<TLyrics>["seedSession"] = (state, options) => {
    const binding = this.binding;
    if (!binding) return Promise.reject(new Error("Playback Host Authority is not bound."));
    return binding.seedSession(state, options);
  };

  start: PlaybackRuntimeAuthorityPort<TLyrics>["start"] = (state) => {
    const binding = this.binding;
    if (!binding) return Promise.reject(new Error("Playback Host Authority is not bound."));
    return binding.start(state);
  };

  stop(): void {
    this.binding?.stop();
  }

  unbind(): void {
    this.binding = null;
  }
}

export function createDeferredPlaybackHostAuthorityPort<
  TLyrics = unknown,
>(): PlaybackHostAuthorityPortProxy<TLyrics> {
  return new DeferredPlaybackHostAuthorityPort<TLyrics>();
}

/** Routes the media-ended event exclusively into the controller-owned queue path. */
export function createPlaybackHostEndedHandler(
  port: PlaybackHostEndedPort,
): () => Promise<boolean> {
  return () => port.handleEnded();
}

function toTransaction<TLyrics>(
  active: ActiveSession<TLyrics>,
): PlaybackHostMediaProjectionTransaction<TLyrics> {
  const state = active.session.state;
  return {
    player: {
      currentTrack: state.track,
      durationMs: active.durationMs,
      intent: active.intent,
      lyrics: active.lyrics,
      phase: state.phase,
      quality: active.quality,
      sessionKey: active.session.key,
      sourceLoadRevision: active.session.sourceLoadRevision,
      sourceUrl: active.sourceUrl,
      volume: state.volume,
    },
    time: {
      positionMs: active.session.positionMs ?? 0,
      totalTimeMs: active.durationMs,
    },
  };
}

function cloneActiveSession<TLyrics>(active: ActiveSession<TLyrics>): ActiveSession<TLyrics> {
  return {
    ...active,
    session: {
      ...active.session,
      state: { ...active.session.state },
    },
  };
}

function matchesActiveSession<TLyrics>(
  active: ActiveSession<TLyrics>,
  session: Pick<PlaybackRuntimeSession<TLyrics>, "key" | "sourceLoadRevision">,
  sourceLoadRevision: number,
): boolean {
  return (
    active.session.key === session.key &&
    active.session.sourceLoadRevision === session.sourceLoadRevision &&
    active.session.sourceLoadRevision === sourceLoadRevision
  );
}

function assertSession<TLyrics>(session: PlaybackRuntimeSession<TLyrics>): void {
  if (!session.key) throw new TypeError("Playback Host media projection requires a session key.");
  if (!Number.isSafeInteger(session.sourceLoadRevision) || session.sourceLoadRevision < 0) {
    throw new RangeError(
      "Playback Host media projection requires a non-negative source-load revision.",
    );
  }
  if (
    session.positionMs !== undefined &&
    (!Number.isFinite(session.positionMs) || session.positionMs < 0)
  ) {
    throw new RangeError("Playback Host media projection requires a finite non-negative position.");
  }
}

function unavailable(command: PlaybackCommand): PlaybackCommandReceipt {
  return {
    commandId: command.commandId,
    reason: "playback-host-authority-not-bound",
    status: "unavailable",
  };
}
