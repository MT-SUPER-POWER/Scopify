import type { MusicProvider, MusicResourceRef } from "./identity";

/**
 * What a comment thread hangs on. Tracks, albums, playlists and MVs are ordinary resources; the
 * two voice kinds exist only on platforms with podcasts (`podcast`) and have no `MusicResourceRef`.
 */
export type MusicCommentTargetKind = "track" | "album" | "playlist" | "mv" | "voice" | "voice-list";

export interface MusicCommentTarget {
  provider: MusicProvider;
  kind: MusicCommentTargetKind;
  id: string;
}

/** The target of a comment thread on a plain resource reference. */
export function commentTargetOf(
  ref: MusicResourceRef<"track" | "album" | "playlist" | "mv">,
): MusicCommentTarget {
  return { provider: ref.provider, kind: ref.kind, id: ref.id };
}

export interface MusicCommentAuthor {
  /** The platform's user ID; null when the platform names only a nickname. */
  id: string | null;
  name: string;
  avatarUrl: string | null;
}

/** The comment a reply answers, as the platform quotes it. */
export interface MusicCommentQuote {
  commentId: string | null;
  authorName: string | null;
  /** Null when the quoted comment was deleted. */
  content: string | null;
}

export interface MusicComment {
  id: string;
  author: MusicCommentAuthor;
  content: string;
  /** Milliseconds since the epoch; null when the platform does not say. */
  createdAt: number | null;
  /** The platform's own wording of the time ("3 days ago"); null when it gives none. */
  timeLabel: string | null;
  likeCount: number;
  /** Whether the signed-in account liked it; null when the platform cannot tell. */
  liked: boolean | null;
  /** Replies under this comment; 0 when it has none or the platform does not count them. */
  replyCount: number;
  /** Where the author posted from ("Shanghai"); null when unknown. */
  location: string | null;
  /** Set on a reply that quotes the comment it answers. */
  quote: MusicCommentQuote | null;
}

/** `hot` puts popular comments first, `latest` is newest first. */
export type MusicCommentSort = "hot" | "latest";

export interface MusicCommentPageRequest {
  sort: MusicCommentSort;
  /** The page number of the page to read, from 1. */
  pageNo: number;
  /** The `nextCursor` of the previous page; absent for the first page. */
  cursor?: string;
  pageSize: number;
  signal?: AbortSignal;
}

export interface MusicCommentPage {
  comments: MusicComment[];
  /** The platform's total for the thread; null when it does not report one. */
  total: number | null;
  hasMore: boolean;
  /** Passed back as `cursor` to read the next page. */
  nextCursor: string | null;
}

export interface MusicCommentRepliesRequest {
  /** The `nextCursor` of the previous page; absent for the first page. */
  cursor?: string;
  pageSize: number;
  signal?: AbortSignal;
}

/** What the comment page header shows about the thread's resource. */
export interface MusicCommentTargetHeader {
  title: string;
  /** The album or owner line under the title; null when absent. */
  subtitle: string | null;
  coverUrl: string | null;
  artists: readonly { id: string; name: string; avatarUrl: string | null }[];
}

/**
 * Comment reading, implemented by every platform with `comments.read`. Writing is optional and
 * present with `comments.write`; replies under a comment with `comments.replies`.
 */
export interface MusicCommentSource {
  /** The kinds of resource the platform has comment threads for. */
  readonly commentTargetKinds: ReadonlySet<MusicCommentTargetKind>;
  getComments(
    target: MusicCommentTarget,
    request: MusicCommentPageRequest,
  ): Promise<MusicCommentPage>;
  getCommentCount(target: MusicCommentTarget, signal?: AbortSignal): Promise<number>;
  /** The most liked comments, for a preview; falls back to the newest when nothing is hot. */
  getHotComments(
    target: MusicCommentTarget,
    limit: number,
    signal?: AbortSignal,
  ): Promise<{ comments: MusicComment[]; total: number }>;
  getCommentTargetHeader(
    target: MusicCommentTarget,
    signal?: AbortSignal,
  ): Promise<MusicCommentTargetHeader>;
  /** `comments.replies`: the replies under one comment. */
  getCommentReplies?(
    target: MusicCommentTarget,
    commentId: string,
    request: MusicCommentRepliesRequest,
  ): Promise<MusicCommentPage>;
  /** `comments.write` */
  addComment?(target: MusicCommentTarget, content: string): Promise<void>;
  /** `comments.write` */
  replyToComment?(target: MusicCommentTarget, commentId: string, content: string): Promise<void>;
  /** `comments.write` */
  deleteComment?(target: MusicCommentTarget, commentId: string): Promise<void>;
  /** `comments.write` */
  setCommentLiked?(target: MusicCommentTarget, commentId: string, liked: boolean): Promise<void>;
}
