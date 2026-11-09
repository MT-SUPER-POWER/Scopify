import { qqClient } from "@/lib/providers/qq/client";
import { ApiError } from "@/lib/web/apiError";
import type {
  QqAlbumDetailDto,
  QqAlbumDetailResponseDto,
  QqAlbumSubscribeDto,
} from "@/types/providers/qq/albumApi";

/** An album with its songs. QQ answers 200 with a business code for an unknown album. */
export async function getQqAlbum(
  albumMid: string,
  signal?: AbortSignal,
): Promise<QqAlbumDetailDto> {
  const data = await qqClient.requestData<QqAlbumDetailResponseDto>({
    method: "GET",
    url: "/getAlbumInfo",
    params: { albummid: albumMid },
    signal,
    errorContext: { operation: "qq.album.detail", albumMid },
  });
  const album = data.response.code === 0 ? data.response.data : undefined;
  if (!album) {
    throw new ApiError({
      kind: "business",
      data,
      message: `QQ album ${albumMid} is unavailable (code ${data.response.code}).`,
    });
  }
  return album;
}

export function setQqAlbumSubscribed(albumMid: string, subscribed: boolean) {
  return qqClient.requestData<QqAlbumSubscribeDto>({
    method: "POST",
    url: "/user/album/subscribe",
    data: { id: albumMid, subscribed },
    errorContext: { operation: "qq.album.subscribe", albumMid, subscribed },
  });
}
