import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import type { SongDetail } from "@/types/api/music";
import type { Song } from "@/types/search";

export function toVoiceSongDetail(song: Song, fallbackCoverUrl = "", voiceId?: number): SongDetail {
  return {
    al: {
      id: song.album.id,
      name: song.album.name,
      picUrl: resolveCoverUrl(
        // A voice program's cover is the content artwork shown in search.
        // The embedded mainSong album often carries NetEase's non-empty
        // generic music-note placeholder, so it must not win over it.
        fallbackCoverUrl,
        song.album.picUrl,
        song.album.blurPicUrl,
        song.artists[0]?.picUrl,
      ),
    },
    ar: song.artists.map((artist) => ({ id: artist.id, name: artist.name })),
    dt: song.duration,
    fee: song.fee ?? 0,
    id: song.id,
    name: song.name,
    publishTime: song.album.publishTime,
    ...(voiceId === undefined ? {} : { voiceId }),
  };
}
