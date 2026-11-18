import type {
  MusicComment,
  MusicCommentPage,
  MusicCommentQuote,
  MusicCommentTargetHeader,
} from "@scopify/music-domain/comment";

import type { CommentResourceHeaderData } from "@/lib/providers/netease/commentHeader";
import type {
  FloorCommentResponse,
  NewCommentResponse,
} from "@/types/providers/netease/commentApi";
import type { NeteaseComment } from "@/types/song/api";

const DELETED_MARK = "该评论已删除";

/** NetEase sends the posting place either as a string or as an object, and with a prefix. */
function locationOf(comment: NeteaseComment): string | null {
  const raw = comment.ipLocation ?? comment.location;
  if (!raw) return null;
  const location = typeof raw === "string" ? raw : (raw.location ?? raw.ip ?? "");
  const cleaned = location
    .trim()
    .replace(/^IP属地[：:]\s*/i, "")
    .replace(/^IP[：:]\s*/i, "");
  return cleaned.length > 0 ? cleaned : null;
}

function quoteOf(comment: NeteaseComment): MusicCommentQuote | null {
  const replied = comment.beReplied?.[0];
  if (!replied) return null;
  return {
    commentId: replied.beRepliedCommentId === undefined ? null : String(replied.beRepliedCommentId),
    authorName: replied.user?.nickname ?? null,
    content: !replied.content || replied.content.includes(DELETED_MARK) ? null : replied.content,
  };
}

export function adaptNeteaseComment(raw: NeteaseComment): MusicComment {
  return {
    id: String(raw.commentId),
    author: {
      id: String(raw.user.userId),
      name: raw.user.nickname,
      avatarUrl: raw.user.avatarUrl || null,
    },
    content: raw.content,
    createdAt: raw.time ?? null,
    timeLabel: raw.timeStr || null,
    likeCount: raw.likedCount,
    liked: raw.liked,
    replyCount: raw.showFloorComment?.replyCount ?? 0,
    location: locationOf(raw),
    quote: quoteOf(raw),
  };
}

export function adaptNeteaseNewComments(response: NewCommentResponse): MusicCommentPage {
  const data = response.data;
  return {
    comments: (data?.comments ?? []).map(adaptNeteaseComment),
    total: data?.totalCount ?? 0,
    hasMore: data?.hasMore ?? false,
    nextCursor: data?.cursor === undefined ? null : String(data.cursor),
  };
}

export function adaptNeteaseFloorComments(response: FloorCommentResponse): MusicCommentPage {
  const data = response.data;
  return {
    comments: (data?.comments ?? []).map(adaptNeteaseComment),
    total: data?.totalCount ?? 0,
    hasMore: data?.hasMore ?? false,
    nextCursor: data?.time === undefined ? null : String(data.time),
  };
}

export function adaptNeteaseCommentHeader(
  header: CommentResourceHeaderData,
): MusicCommentTargetHeader {
  return {
    title: header.title,
    subtitle: header.albumName ?? null,
    coverUrl: header.coverUrl || null,
    artists: header.artists.map((artist) => ({
      id: String(artist.id),
      name: artist.name,
      avatarUrl: artist.avatarUrl || null,
    })),
  };
}
