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
