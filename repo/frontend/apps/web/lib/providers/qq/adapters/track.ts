import type { MusicTrack } from "@scopify/music-domain/track";
import type { QqTrackDto } from "@/types/providers/qq/trackApi";

export function adaptQqTrack(raw: QqTrackDto): MusicTrack {
  return {
    ref: { provider: "qq", kind: "track", id: raw.mid },
    title: raw.name,
    durationMs: raw.interval * 1000,
    artists: raw.singer.map((artist) => ({
      ref: { provider: "qq", kind: "artist", id: artist.mid },
      name: artist.name,
    })),
    album: {
      ref: { provider: "qq", kind: "album", id: raw.album.mid },
      title: raw.album.name,
      // This DTO has no explicit cover URL. Missing artwork is not an invented URL.
      coverUrl: null,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a song object the backend passed through from the upstream untouched (cloud drive and
 * listening ranking). Only a song with a MID and a title counts; one that does not parse is
 * left out by the caller rather than shown with invented fields.
 */
export function readQqRawTrack(raw: unknown): QqTrackDto | null {
  if (!isRecord(raw)) return null;
  const mid = typeof raw.mid === "string" ? raw.mid.trim() : "";
  const name =
    typeof raw.name === "string" && raw.name
      ? raw.name
      : typeof raw.title === "string"
        ? raw.title
        : "";
  if (!mid || !name) return null;
  const singers = Array.isArray(raw.singer) ? raw.singer.filter(isRecord) : [];
  const album = isRecord(raw.album) ? raw.album : {};
  return {
    id: typeof raw.id === "number" ? raw.id : 0,
    mid,
    name,
    interval: typeof raw.interval === "number" && raw.interval > 0 ? raw.interval : 0,
    singer: singers.map((singer) => ({
      id: typeof singer.id === "number" ? singer.id : 0,
      mid: typeof singer.mid === "string" ? singer.mid : "",
      name: typeof singer.name === "string" ? singer.name : "",
    })),
    album: {
      id: typeof album.id === "number" ? album.id : 0,
      mid: typeof album.mid === "string" ? album.mid : "",
      name: typeof album.name === "string" ? album.name : "",
    },
  };
}
