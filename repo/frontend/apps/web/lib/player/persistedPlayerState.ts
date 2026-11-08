import type { MusicProvider } from "@scopify/music-domain/identity";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import type { NeteaseTrackDto } from "@/types/providers/netease/trackApi";
import type { PlayerStore, PlayerTrack } from "@/types/player/model";

/**
 * Version 1 stores interface tracks (`currentTrack`, queues of `PlayerTrack`). Version 0 stored
 * NetEase `SongDetail` objects under `currentSongDetail`; those are converted on load.
 */
export const PLAYER_PERSISTENCE_VERSION = 1;

type PersistedQueueState = Pick<
  PlayerStore,
  | "currentTrack"
  | "historyIndex"
  | "historyStack"
  | "lyric"
  | "originalQueue"
  | "queue"
  | "queueIndex"
>;

const PROVIDERS: ReadonlySet<string> = new Set<MusicProvider>(["netease", "qq"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlayerTrack(value: unknown): value is PlayerTrack {
  if (!isRecord(value) || !isRecord(value.ref)) return false;
  return (
    typeof value.ref.provider === "string" &&
    PROVIDERS.has(value.ref.provider) &&
    value.ref.kind === "track" &&
    typeof value.ref.id === "string" &&
    value.ref.id !== "" &&
    typeof value.title === "string" &&
    typeof value.durationMs === "number" &&
    Array.isArray(value.artists) &&
    value.artists.every((artist) => isRecord(artist) && typeof artist.name === "string") &&
    (value.album === null || isRecord(value.album))
  );
}

function isLegacySongDetail(value: unknown): value is NeteaseTrackDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    Array.isArray(value.ar) &&
    value.ar.every((artist) => isRecord(artist) && typeof artist.name === "string") &&
    isRecord(value.al) &&
    typeof value.al.name === "string"
  );
}

/** A stored queue entry in either shape, or null when it is neither. */
export function restorePersistedTrack(value: unknown): PlayerTrack | null {
  if (isPlayerTrack(value)) return value;
  if (!isLegacySongDetail(value)) return null;
  try {
    return adaptNeteaseTrack({
      ...value,
      al: { ...value.al, id: typeof value.al.id === "number" ? value.al.id : 0 },
      ar: value.ar.map((artist) => ({
        ...artist,
        id: typeof artist.id === "number" ? artist.id : 0,
      })),
      dt: typeof value.dt === "number" ? value.dt : 0,
    });
  } catch {
    return null;
  }
}

function restoreTracks(value: unknown): { dropped: boolean; tracks: PlayerTrack[] } {
  if (!Array.isArray(value)) return { dropped: value !== undefined, tracks: [] };
  const tracks = value.flatMap((item) => {
    const track = restorePersistedTrack(item);
    return track ? [track] : [];
  });
  return { dropped: tracks.length !== value.length, tracks };
}

function isIndexIn(index: unknown, length: number): index is number {
  return Number.isInteger(index) && (index as number) >= 0 && (index as number) < length;
}

/**
 * Rebuilds the queue part of a stored player state. Anything unreadable is dropped instead of
 * reaching the player; when entries are dropped the stored indexes no longer line up, so the
 * position is found again from the current track and the history restarts there.
 */
export function restorePersistedQueueState(persisted: unknown): PersistedQueueState {
  const state = isRecord(persisted) ? persisted : {};
  const currentTrack = restorePersistedTrack(state.currentTrack ?? state.currentSongDetail);
  const queue = restoreTracks(state.queue);
  const originalQueue = restoreTracks(state.originalQueue);
  const lyric =
    currentTrack && isRecord(state.lyric) ? (state.lyric as PlayerStore["lyric"]) : null;

  const historyStack = Array.isArray(state.historyStack) ? state.historyStack : [];
  const indexesValid =
    !queue.dropped &&
    (state.queueIndex === -1 || isIndexIn(state.queueIndex, queue.tracks.length)) &&
    historyStack.every((index) => isIndexIn(index, queue.tracks.length)) &&
    (state.historyIndex === -1 || isIndexIn(state.historyIndex, historyStack.length));

  if (indexesValid) {
    return {
      currentTrack,
      historyIndex: state.historyIndex as number,
      historyStack: historyStack as number[],
      lyric,
      originalQueue: originalQueue.dropped ? [...queue.tracks] : originalQueue.tracks,
      queue: queue.tracks,
      queueIndex: state.queueIndex as number,
    };
  }

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const queueIndex =
    currentKey === null
      ? -1
      : queue.tracks.findIndex((track) => playerTrackKey(track) === currentKey);
  return {
    currentTrack,
    historyIndex: queueIndex >= 0 ? 0 : -1,
    historyStack: queueIndex >= 0 ? [queueIndex] : [],
    lyric,
    originalQueue: originalQueue.dropped ? [...queue.tracks] : originalQueue.tracks,
    queue: queue.tracks,
    queueIndex,
  };
}
