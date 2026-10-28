import type { SongDetail } from "@/types/song/api";
import type { Song } from "@/types/search/model";

export function songToSongDetail(song: Song): SongDetail {
  const picUrl = song.album?.picUrl || song.artists?.[0]?.picUrl || "";
  return {
    al: { id: song.album?.id ?? 0, name: song.album?.name ?? "", picUrl },
    alia: song.alias,
    ar: (song.artists || []).map((a) => ({ id: a.id, name: a.name })),
    dt: song.duration,
    fee: song.fee ?? 0,
    id: song.id,
    name: song.name,
    publishTime: song.album?.publishTime || 0,
    ...(song.mvid ? { mv: song.mvid } : {}),
  };
}
