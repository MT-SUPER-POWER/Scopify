import type { SongSearchResource } from "@/types/search/api";
import type { SongDetail } from "@/types/api/music";

export function mapSheetSearchSong(
  resource: SongSearchResource,
  unknownSong: string,
  unknownAlbum: string,
): SongDetail {
  const source = resource.baseInfo?.simpleSongData;
  if (!source || !Number.isSafeInteger(source.id) || source.id <= 0)
    throw new Error("Invalid sheet song search resource");
  return {
    id: source.id,
    name: source.name || unknownSong,
    dt: source.dt ?? 0,
    fee: source.fee ?? 0,
    publishTime: 0,
    ar: (source.ar || []).map((artist) => ({ id: artist.id, name: artist.name })),
    al: {
      id: source.al?.id ?? 0,
      name: source.al?.name || unknownAlbum,
      picUrl: source.al?.picUrl || source.al?.blurPicUrl || "",
    },
  };
}
