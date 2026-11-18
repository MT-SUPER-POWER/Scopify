import { qqClient } from "@/lib/providers/qq/client";
import type { QqCommentCountDto, QqCommentsDto } from "@/types/providers/qq/commentApi";

/** Comments are public reads, so no session is sent. `songId` is the numeric ID, not the MID. */
export function getQqSongComments(
  kind: "hot" | "new",
  songId: string,
  page: { offset: number; limit: number },
  signal?: AbortSignal,
) {
  return qqClient.requestData<QqCommentsDto>({
    method: "GET",
    url: kind === "hot" ? "/comment/hot" : "/comment/new",
    params: { id: songId, offset: page.offset, limit: page.limit },
    noSession: true,
    signal,
    errorContext: { operation: `qq.comment.${kind}` },
  });
}

export function getQqSongCommentCount(songId: string, signal?: AbortSignal) {
  return qqClient.requestData<QqCommentCountDto>({
    method: "GET",
    url: "/comment/count",
    params: { id: songId },
    noSession: true,
    signal,
    errorContext: { operation: "qq.comment.count" },
  });
}
