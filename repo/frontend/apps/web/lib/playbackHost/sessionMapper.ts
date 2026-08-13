import {
  isPlaybackSessionSeed,
  type PlaybackHostSessionSnapshot,
  type PlaybackQueueEntry,
  type PlaybackSessionSeed,
} from "@scopifymusicplayer/desktop-contract/playbackHostControl";

import type { SongDetail } from "@/types/api/music";
import type { PlayerStore } from "@/types/player";

/**
 * The session revision is local to one Playback Host authority lifetime. It
 * deliberately fails at the safe-integer limit rather than wrapping: a new
 * authority/session must be established before that point.
 */
export const INITIAL_PLAYBACK_SESSION_REVISION = 0;

export function createInitialPlaybackSessionRevision(): number {
  return INITIAL_PLAYBACK_SESSION_REVISION;
}

/** Advances a wire-safe revision without ever reusing or overflowing one. */
export function nextPlaybackSessionRevision(currentRevision: number): number {
  if (!Number.isSafeInteger(currentRevision) || currentRevision < 0) {
    throw new TypeError("Playback session revision must be a non-negative safe integer.");
  }

  if (currentRevision === Number.MAX_SAFE_INTEGER) {
    throw new RangeError(
      "Playback session revision reached Number.MAX_SAFE_INTEGER; create a new Playback Host session instead of wrapping.",
    );
  }

  return currentRevision + 1;
}

/**
 * Drops API-only fields and creates a structured-clone-safe queue entry. Media
 * source URLs, lyric payloads, cookies, and playback callbacks are not part of
 * SongDetail and never enter this boundary.
 */
export function toPlaybackQueueEntry(song: SongDetail): PlaybackQueueEntry {
  return {
    ...(song.alia === undefined ? {} : { alias: [...song.alia] }),
    album: {
      artworkUrl: song.al.picUrl,
      id: song.al.id,
      title: song.al.name,
    },
    artists: song.ar.map((artist) => ({ id: artist.id, name: artist.name })),
    durationMs: song.dt,
    fee: song.fee,
    id: song.id,
    publishTime: song.publishTime,
    title: song.name,
    ...(song.voiceId === undefined ? {} : { voiceId: song.voiceId }),
  };
}

/** Recreates the UI-safe SongDetail projection without inventing API baggage. */
export function fromPlaybackQueueEntry(entry: PlaybackQueueEntry): SongDetail {
  return {
    ...(entry.alias === undefined ? {} : { alia: [...entry.alias] }),
    al: {
      id: entry.album.id,
      name: entry.album.title,
      picUrl: entry.album.artworkUrl,
    },
    ar: entry.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    dt: entry.durationMs,
    fee: entry.fee,
    id: entry.id,
    name: entry.title,
    publishTime: entry.publishTime,
    ...(entry.voiceId === undefined ? {} : { voiceId: entry.voiceId }),
  };
}

/**
 * Maps the Main Window's durable player state into the versioned Host session
 * DTO. `resumePositionMs` is intentionally supplied explicitly because it is
 * owned by the time store, not PlayerStore.
 */
export function toPlaybackSessionSeed(
  player: Pick<
    PlayerStore,
    | "historyIndex"
    | "historyStack"
    | "isPlaying"
    | "isShuffle"
    | "musicQuality"
    | "originalQueue"
    | "playlistId"
    | "queue"
    | "queueIndex"
    | "repeatMode"
    | "volume"
  >,
  resumePositionMs: number,
  revision: number,
): PlaybackSessionSeed {
  const session: PlaybackSessionSeed = {
    intent: player.isPlaying ? "play" : "pause",
    quality: player.musicQuality,
    queue: {
      historyIndex: player.historyIndex,
      historyStack: [...player.historyStack],
      originalQueue: player.originalQueue.map(toPlaybackQueueEntry),
      playlistId: player.playlistId,
      queue: player.queue.map(toPlaybackQueueEntry),
      queueIndex: player.queueIndex,
      repeatMode: player.repeatMode,
      shuffleEnabled: player.isShuffle,
    },
    resumePositionMs,
    revision,
    // PlayerStore is UI-facing percentage (0–100); the wire contract is 0–1.
    volume: player.volume / 100,
  };

  if (!isPlaybackSessionSeed(session)) {
    throw new TypeError("Player state cannot be represented by PlaybackSessionSeed.");
  }

  return session;
}

/**
 * Builds only the Main Window data that can be restored from a Host snapshot.
 * Current media URLs, lyric data, cookies, and store actions remain explicitly
 * absent so the receiving window resolves them through its own services.
 */
export function toPlayerSessionProjection(session: PlaybackSessionSeed) {
  const queue = session.queue.queue.map(fromPlaybackQueueEntry);
  const queueIndex = session.queue.queueIndex;

  return {
    currentSongDetail: queueIndex >= 0 ? (queue[queueIndex] ?? null) : null,
    historyIndex: session.queue.historyIndex,
    historyStack: [...session.queue.historyStack],
    isPlaying: session.intent === "play",
    isShuffle: session.queue.shuffleEnabled,
    musicQuality: session.quality,
    originalQueue: session.queue.originalQueue.map(fromPlaybackQueueEntry),
    playbackSessionRevision: session.revision,
    playlistId: session.queue.playlistId,
    queue,
    queueIndex,
    repeatMode: session.queue.repeatMode,
    resumePositionMs: session.resumePositionMs,
    // Restore the UI percentage rather than leaking the transport representation.
    volume: session.volume * 100,
  } satisfies Pick<
    PlayerStore,
    | "currentSongDetail"
    | "historyIndex"
    | "historyStack"
    | "isPlaying"
    | "isShuffle"
    | "musicQuality"
    | "originalQueue"
    | "playbackSessionRevision"
    | "playlistId"
    | "queue"
    | "queueIndex"
    | "repeatMode"
    | "volume"
  > & { resumePositionMs: number };
}

/** Adapts the versioned host message while keeping message parsing outside this pure mapper. */
export function toPlayerSessionProjectionFromSnapshot(snapshot: PlaybackHostSessionSnapshot) {
  return toPlayerSessionProjection(snapshot.session);
}
