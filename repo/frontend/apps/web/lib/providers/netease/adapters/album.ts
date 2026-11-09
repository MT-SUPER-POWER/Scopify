import type { MusicAlbumArtist, MusicAlbumContent } from "@scopify/music-domain/album";

import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";
import type { NeteaseAlbum, NeteaseAlbumArtist } from "@/types/providers/netease/albumApi";
import { pruneSongDetail, type RawSongDetail } from "@/types/song/api";

function adaptAlbumArtist(raw: NeteaseAlbumArtist): MusicAlbumArtist {
  return {
    ref: raw.id === undefined ? null : { provider: "netease", kind: "artist", id: String(raw.id) },
    name: raw.name ?? "",
    avatarUrl: raw.picUrl || raw.img1v1Url || null,
  };
}

/** The main artist first, then the other credited ones. */
function creditedArtists(album: NeteaseAlbum): NeteaseAlbumArtist[] {
  const others = album.artists ?? [];
  const main = album.artist;
  if (!main) return others;
  return [main, ...others.filter((artist) => artist.id !== main.id)];
}

/** The album with its songs; a song that lacks album artwork gets the album's own. */
export function adaptNeteaseAlbum(
  album: NeteaseAlbum,
  songs: readonly RawSongDetail[],
  requestedId: string,
): MusicAlbumContent {
  const cover = album.picUrl ?? album.blurPicUrl;
  return {
    album: {
      ref: { provider: "netease", kind: "album", id: String(album.id ?? requestedId) },
      title: album.name ?? "",
      coverUrl: album.picUrl || null,
      artists: creditedArtists(album).map(adaptAlbumArtist),
      publishedAt: album.publishTime || null,
      description: album.description ?? "",
      company: album.company || null,
      releaseType: album.type || null,
      subType: album.subType || null,
      trackCount: album.size ?? 0,
    },
    tracks: songs.map((song) =>
      adaptNeteaseTrack(
        pruneSongDetail({
          ...song,
          al: {
            id: song.al?.id ?? 0,
            name: song.al?.name ?? "",
            picUrl: song.al?.picUrl ?? cover ?? "",
          },
        }),
      ),
    ),
  };
}
