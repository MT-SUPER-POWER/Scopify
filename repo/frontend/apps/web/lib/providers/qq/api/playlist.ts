import { qqClient } from "@/lib/providers/qq/client";
import { ApiError } from "@/lib/web/apiError";
import type {
  QqPlaylistDetailDto,
  QqPlaylistDetailResponseDto,
} from "@/types/providers/qq/playlistApi";

/**
 * A playlist with its songs. The backend reads anonymously first and retries with the QQ
 * session for playlists QQ only serves to their account.
 */
export async function getQqPlaylistDetail(
  disstid: string,
  signal?: AbortSignal,
): Promise<QqPlaylistDetailDto> {
  const data = await qqClient.requestData<QqPlaylistDetailResponseDto>({
    method: "GET",
    url: `/getSongListDetail/${encodeURIComponent(disstid)}`,
    signal,
    errorContext: { operation: "qq.playlist.detail", disstid },
  });
  const playlist = data.response.code === 0 ? data.response.cdlist?.[0] : undefined;
  if (!playlist) {
    throw new ApiError({
      kind: "business",
      data,
      message: `QQ playlist ${disstid} is unavailable (code ${data.response.code}).`,
    });
  }
  return playlist;
}
