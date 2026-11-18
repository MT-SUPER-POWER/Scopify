import type { MusicTrack } from "@scopify/music-domain/track";

import type {
  NeteaseMusicTrack,
  NeteaseTrackDto,
  NeteaseTrackExtras,
} from "@/types/providers/netease/trackApi";
import type { PlayerTrack } from "@/types/player/model";
import type { SongDetail } from "@/types/song/api";

const EXTRA_KEYS = [
  "alia",
  "commentCount",
  "fee",
  "likedCount",
  "mv",
  "pc",
  "privilege",
  "publishTime",
  "voiceId",
] as const satisfies readonly (keyof NeteaseTrackExtras)[];

/** Only the extras the song carries, so persisted queues do not fill up with `undefined`. */
function pickExtras(raw: NeteaseTrackDto): NeteaseTrackExtras {
  const extras: Record<string, unknown> = {};
  for (const key of EXTRA_KEYS) {
    if (raw[key] !== undefined) extras[key] = raw[key];
  }
  return extras as NeteaseTrackExtras;
}

export function adaptNeteaseTrack(raw: NeteaseTrackDto): NeteaseMusicTrack {
  return {
    ref: { provider: "netease", kind: "track", id: String(raw.id) },
    title: raw.name,
    durationMs: raw.dt,
    artists: raw.ar.map((artist) => ({
      ref: { provider: "netease", kind: "artist", id: String(artist.id) },
      name: artist.name,
    })),
    album: {
      ref: { provider: "netease", kind: "album", id: String(raw.al.id) },
      title: raw.al.name,
      coverUrl: raw.al.picUrl || raw.al.coverUrl || null,
    },
    netease: pickExtras(raw),
  };
}

/** The NetEase song ID of a track, or null when the track is from another platform. */
export function getNeteaseTrackId(track: MusicTrack | null | undefined): number | null {
  if (track?.ref.provider !== "netease") return null;
  const id = Number(track.ref.id);
  return Number.isSafeInteger(id) ? id : null;
}

// One song object per queue entry, so memoized consumers stay stable and a song handed to a
// NetEase-only UI can be traced back to the exact queue entry (Personal FM repeats songs).
const songByTrack = new WeakMap<PlayerTrack, SongDetail>();
const trackBySong = new WeakMap<SongDetail, PlayerTrack>();

/**
 * The NetEase song shape back from a NetEase track, for NetEase-only features (lyrics,
 * comments, sharing) that have not moved to interface types. Null for other platforms.
 */
export function toNeteaseSongDetail(track: PlayerTrack | null | undefined): SongDetail | null {
  const id = getNeteaseTrackId(track);
  if (!track || id === null) return null;
  const cached = songByTrack.get(track);
  if (cached) return cached;
  const song = buildSongDetail(track, id);
  songByTrack.set(track, song);
  trackBySong.set(song, track);
  return song;
}

/** The NetEase songs among tracks, in order, for NetEase-only actions on several of them. */
export function toNeteaseSongDetails(tracks: readonly PlayerTrack[]): SongDetail[] {
  return tracks.flatMap((track) => {
    const song = toNeteaseSongDetail(track);
    return song ? [song] : [];
  });
}

/** The queue entry a song from {@link toNeteaseSongDetail} was made from. */
export function getPlayerTrackOfNeteaseSong(song: SongDetail): PlayerTrack | undefined {
  return trackBySong.get(song);
}

/** A NetEase song as a queue entry, reusing the entry it came from when there is one. */
export function toNeteasePlayerTrack(song: SongDetail): PlayerTrack {
  return trackBySong.get(song) ?? adaptNeteaseTrack(song);
}

/**
 * NetEase songs a page lists as tracks. Each track hands its own song back through
 * {@link toNeteaseSongDetail}, so NetEase-only actions on a row (cloud files, Personal FM
 * feedback) receive the song the page loaded with every field intact.
 */
export function toNeteaseTrackList(songs: readonly SongDetail[]): PlayerTrack[] {
  return songs.map((song) => {
    const known = trackBySong.get(song);
    if (known) return known;
    const track = adaptNeteaseTrack(song);
    songByTrack.set(track, song);
    trackBySong.set(song, track);
    return track;
  });
}

function buildSongDetail(track: PlayerTrack, id: number): SongDetail {
  const albumId = Number(track.album?.ref.id ?? 0);
  return {
    ...track.netease,
    publishTime: track.netease?.publishTime ?? 0,
    fee: track.netease?.fee ?? 0,
    id,
    name: track.title,
    dt: track.durationMs,
    ar: track.artists.map((artist) => ({ id: Number(artist.ref.id), name: artist.name })),
    al: {
      id: Number.isFinite(albumId) ? albumId : 0,
      name: track.album?.title ?? "",
      picUrl: track.album?.coverUrl ?? "",
    },
  };
}
