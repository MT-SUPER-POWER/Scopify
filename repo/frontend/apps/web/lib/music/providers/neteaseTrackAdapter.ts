import type { MusicTrack } from "@scopify/music-domain/track";
import type { NeteaseTrackDto } from "@/types/providers/netease/trackApi";

export function adaptNeteaseTrack(raw: NeteaseTrackDto): MusicTrack {
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
  };
}
