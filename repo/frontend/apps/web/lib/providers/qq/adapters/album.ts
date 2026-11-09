import type { MusicAlbumContent } from "@scopify/music-domain/album";
import type { MusicTrack } from "@scopify/music-domain/track";

import { parseQqDate } from "@/lib/providers/qq/adapters/artist";
import { qqAlbumCoverUrl } from "@/lib/providers/qq/adapters/playlist";
import { qqArtistAvatarUrl } from "@/lib/providers/qq/adapters/search";
import type { QqAlbumDetailDto, QqAlbumSongDto } from "@/types/providers/qq/albumApi";

function adaptAlbumSong(raw: QqAlbumSongDto, albumMid: string, albumTitle: string): MusicTrack {
  const mid = raw.albummid || albumMid;
  return {
    ref: { provider: "qq", kind: "track", id: raw.songmid },
    title: raw.songname,
    durationMs: raw.interval * 1000,
    artists: raw.singer.map((artist) => ({
      ref: { provider: "qq", kind: "artist", id: artist.mid },
      name: artist.name,
    })),
    album: {
      ref: { provider: "qq", kind: "album", id: mid },
      title: raw.albumname || albumTitle,
      coverUrl: qqAlbumCoverUrl(mid),
    },
  };
}

export function adaptQqAlbum(raw: QqAlbumDetailDto): MusicAlbumContent {
  const tracks = (raw.list ?? []).map((song) => adaptAlbumSong(song, raw.mid, raw.name));
  return {
    album: {
      ref: { provider: "qq", kind: "album", id: raw.mid },
      title: raw.name,
      coverUrl: qqAlbumCoverUrl(raw.mid),
      // Compilations have no single singer; then no artist is credited and none is linked.
      artists: raw.singername
        ? [
            {
              ref: raw.singermid ? { provider: "qq", kind: "artist", id: raw.singermid } : null,
              name: raw.singername,
              avatarUrl: raw.singermid ? qqArtistAvatarUrl(raw.singermid) : null,
            },
          ]
        : [],
      publishedAt: parseQqDate(raw.aDate),
      description: raw.desc ?? "",
      company: raw.company || null,
      releaseType: null,
      subType: raw.genre || null,
      trackCount: raw.total_song_num ?? tracks.length,
    },
    tracks,
  };
}
