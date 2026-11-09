import { qqClient } from "@/lib/providers/qq/client";
import { ApiError } from "@/lib/web/apiError";
import type {
  QqSingerAlbumDto,
  QqSingerAlbumsResponseDto,
  QqSingerDetailResponseDto,
  QqSingerHotSongsResponseDto,
  QqSingerSongsResponseDto,
} from "@/types/providers/qq/artistApi";

/** The most songs the backend serves per request. */
export const QQ_SINGER_SONGS_PAGE_LIMIT = 30;

export function getQqSingerDetail(mid: string, signal?: AbortSignal) {
  return qqClient.requestData<QqSingerDetailResponseDto>({
    method: "GET",
    url: "/singer/detail",
    params: { mid },
    signal,
    errorContext: { operation: "qq.singer.detail", mid },
  });
}

/** One request of a singer's songs; `offset` counts songs. */
export function getQqSingerSongs(mid: string, offset: number, signal?: AbortSignal) {
  return qqClient.requestData<QqSingerSongsResponseDto>({
    method: "GET",
    url: "/singer/songs",
    params: { mid, offset, limit: QQ_SINGER_SONGS_PAGE_LIMIT },
    signal,
    errorContext: { operation: "qq.singer.songs", mid, offset },
  });
}

/** The fan count, which only this route reports; unknown when the upstream does not say. */
export async function getQqSingerFans(mid: string, signal?: AbortSignal): Promise<number | null> {
  const data = await qqClient.requestData<QqSingerHotSongsResponseDto>({
    method: "GET",
    url: "/getSingerHotsong",
    params: { singermid: mid, limit: 1, page: 0 },
    signal,
    errorContext: { operation: "qq.singer.fans", mid },
  });
  const fans = data.response.singer?.data?.singer_info?.fans;
  return typeof fans === "number" ? fans : null;
}

/** Albums from `offset` on. The route calls the offset `page`. */
export async function getQqSingerAlbums(
  mid: string,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<{ albums: QqSingerAlbumDto[]; total: number | null }> {
  const data = await qqClient.requestData<QqSingerAlbumsResponseDto>({
    method: "GET",
    url: "/getSingerAlbum",
    params: { singermid: mid, page: offset, limit },
    signal,
    errorContext: { operation: "qq.singer.albums", mid, offset },
  });
  const list = data.response.singer;
  if (data.response.code !== 0 || !list || list.code !== 0) {
    throw new ApiError({
      kind: "business",
      data,
      message: `QQ albums of ${mid} are unavailable (code ${data.response.code}).`,
    });
  }
  return { albums: list.data?.albumList ?? [], total: list.data?.total ?? null };
}
