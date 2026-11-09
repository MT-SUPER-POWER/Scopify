import { qqClient } from "@/lib/providers/qq/client";
import type {
  QqMvDetailDto,
  QqMvListDto,
  QqMvUrlDto,
  QqSongMvsDto,
} from "@/types/providers/qq/mvApi";

export function getQqMvList(page: { offset: number; limit: number }, signal?: AbortSignal) {
  return qqClient.requestData<QqMvListDto>({
    method: "GET",
    url: "/mv/list",
    params: { offset: page.offset, limit: page.limit },
    noSession: true,
    signal,
    errorContext: { operation: "qq.mv.list" },
  });
}

export function getQqMvDetail(vid: string, signal?: AbortSignal) {
  return qqClient.requestData<QqMvDetailDto>({
    method: "GET",
    url: "/mv/detail",
    params: { vid },
    noSession: true,
    signal,
    errorContext: { operation: "qq.mv.detail" },
  });
}

/** With a session the backend reads the links as the account does and may find more qualities. */
export function getQqMvUrl(vid: string, signal?: AbortSignal) {
  return qqClient.requestData<QqMvUrlDto>({
    method: "GET",
    url: "/mv/url",
    params: { vid },
    signal,
    errorContext: { operation: "qq.mv.url" },
  });
}

/** `songId` is the numeric ID, not the MID. */
export function getQqSongMvs(songId: string, signal?: AbortSignal) {
  return qqClient.requestData<QqSongMvsDto>({
    method: "GET",
    url: "/song/mvs",
    params: { id: songId },
    noSession: true,
    signal,
    errorContext: { operation: "qq.song.mvs" },
  });
}
