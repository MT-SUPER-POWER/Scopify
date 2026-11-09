import type { MusicComment, MusicCommentPage } from "@scopify/music-domain/comment";

import { qqSecureUrl } from "@/lib/providers/qq/adapters/playlist";
import type { QqCommentDto, QqCommentsDto } from "@/types/providers/qq/commentApi";

export function adaptQqComment(raw: QqCommentDto): MusicComment {
  return {
    id: raw.id,
    // QQ names the author by nickname only; there is no profile to link to.
    author: { id: null, name: raw.nick, avatarUrl: qqSecureUrl(raw.avatar) },
    content: raw.content,
    createdAt: raw.time === undefined ? null : raw.time * 1000,
    timeLabel: null,
    likeCount: raw.praiseCount ?? 0,
    // Anonymous reads cannot tell what the account liked.
    liked: null,
    // The count is shown, but no route lists the replies, so the thread stays closed.
    replyCount: raw.replyCount ?? 0,
    location: raw.location ?? null,
    quote: null,
  };
}

export function adaptQqCommentPage(dto: QqCommentsDto): MusicCommentPage {
  return {
    comments: dto.comments.map(adaptQqComment),
    total: dto.total ?? null,
    hasMore: dto.more,
    nextCursor: null,
  };
}

/** A thread with no comments, which QQ reports as an error rather than an empty list. */
export const EMPTY_QQ_COMMENT_PAGE: MusicCommentPage = {
  comments: [],
  total: 0,
  hasMore: false,
  nextCursor: null,
};
