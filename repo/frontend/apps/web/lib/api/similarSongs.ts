import request, { requestConfig } from "@/lib/web/request";
import type { SimilarSongDetailsResponse, SimilarSongsResponse } from "@/types/api/similarSongs";

export function getSimilarSongs(id: number, signal?: AbortSignal) {
  return request.get<SimilarSongsResponse>(
    "/song/simi/get",
    requestConfig({
      params: { id },
      signal,
      expectedBusinessCodes: [200],
    }),
  );
}

export function getSimilarSongDetails(ids: number[], signal?: AbortSignal) {
  return request.get<SimilarSongDetailsResponse>(
    "/song/detail",
    requestConfig({
      params: { ids: ids.join(",") },
      signal,
      expectedBusinessCodes: [200],
    }),
  );
}
