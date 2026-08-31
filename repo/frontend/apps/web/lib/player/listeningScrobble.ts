import type { ScrobbleV1Request } from "@/types/api/scrobble";
import type { ListeningScrobbleSession } from "@/types/listeningScrobble";

const MAX_TRACKED_PROGRESS_DELTA_SECONDS = 20;
const MINIMUM_SCROBBLE_SECONDS = 30;

/** Returns the minimum real playback required before a session is reported. */
export function getListeningScrobbleThreshold(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return MINIMUM_SCROBBLE_SECONDS;
  return Math.min(MINIMUM_SCROBBLE_SECONDS, Math.ceil(totalSeconds / 2));
}

/** Rejects seek jumps while retaining ordinary, throttled media-progress updates. */
export function getTrackedListeningDelta(previousSeconds: number, currentSeconds: number) {
  const delta = currentSeconds - previousSeconds;
  return Number.isFinite(delta) && delta > 0 && delta <= MAX_TRACKED_PROGRESS_DELTA_SECONDS
    ? delta
    : 0;
}

export function toScrobbleSourceId(value: number | string | null | undefined) {
  const sourceId = Number(value);
  return Number.isSafeInteger(sourceId) && sourceId > 0 ? String(sourceId) : undefined;
}

/** Builds an upload only for a meaningful, non-duplicated listening session. */
export function createListeningScrobbleRequest(
  session: ListeningScrobbleSession,
  listenedSeconds: number,
): ScrobbleV1Request | null {
  if (!Number.isFinite(session.totalSeconds) || session.totalSeconds <= 0) return null;
  const roundedListenedSeconds = Math.floor(listenedSeconds);
  if (roundedListenedSeconds < getListeningScrobbleThreshold(session.totalSeconds)) return null;

  return {
    artist: session.artist,
    id: session.songId,
    level: "exhigh",
    name: session.title,
    source: "list",
    ...(session.sourceId ? { sourceid: session.sourceId } : {}),
    time: Math.min(roundedListenedSeconds, session.totalSeconds),
    total: session.totalSeconds,
  };
}
