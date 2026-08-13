import type {
  PlaybackSessionState,
  PlaybackTimelineDiscontinuityReason,
} from "@scopifymusicplayer/desktop-contract";

/**
 * The immutable description of a playback session that can be owned by either
 * the in-page runtime or the dedicated Playback Host renderer.
 *
 * `sourceLoadRevision` is provided by the catalog/store adapter. The runtime
 * combines it with its own monotonic load epoch so an older asynchronous URL
 * resolution can never make a newer session playable.
 */
export interface PlaybackRuntimeSession<TLyrics = unknown> {
  key: string;
  positionMs?: number;
  reason?: Extract<PlaybackTimelineDiscontinuityReason, "replay" | "resume" | "track-change">;
  sourceLoadRevision: number;
  state: PlaybackSessionState<TLyrics>;
}

/**
 * A request issued to the catalog boundary when the Authority needs playable
 * media. The catalog adapter owns URL refresh, media-element assignment and
 * source readiness checks; the shared runtime owns supersession only.
 */
export interface PlaybackSourceRequest<TLyrics = unknown> {
  loadEpoch: number;
  session: PlaybackRuntimeSession<TLyrics>;
  sourceLoadRevision: number;
}

/**
 * The only catalog responsibility needed by the Authority path.
 *
 * Returning `true` means the session described in the request is currently
 * playable. Returning `false` keeps the Authority from issuing `play()`.
 */
export interface PlaybackCatalogPort<TLyrics = unknown> {
  ensureSource(request: PlaybackSourceRequest<TLyrics>): boolean | Promise<boolean>;
  /**
   * Synchronously invalidates the current resolver request. Runtime calls this
   * before replacing, clearing, restoring, or stopping a media session so a
   * late resolver result cannot commit into a newer Host projection.
   */
  cancelSource?(): void;
  /**
   * Drops source material for the active Runtime session before a retry. This
   * stays separate from `ensureSource`: callers may request a truly fresh CDN
   * URL without inventing a second queue or reading a renderer store.
   */
  invalidateSource?(request: PlaybackSourceRequest<TLyrics>): void | Promise<void>;
}

/**
 * Queue selection remains a pure domain concern. It returns a complete next
 * session so Runtime never reads Zustand or reaches into catalog state.
 */
export interface PlaybackQueuePort<TLyrics = unknown> {
  next(
    reason: "ended" | "manual",
  ): PlaybackRuntimeSession<TLyrics> | null | Promise<PlaybackRuntimeSession<TLyrics> | null>;
  previous():
    PlaybackRuntimeSession<TLyrics> | null | Promise<PlaybackRuntimeSession<TLyrics> | null>;
}
