/** One comment of GET /comment/hot and /comment/new. The author is known by nickname only. */
export interface QqCommentDto {
  /** Opaque; contains punctuation. */
  id: string;
  content: string;
  nick: string;
  avatar?: string;
  praiseCount?: number;
  /** Seconds since the epoch. */
  time?: number;
  replyCount?: number;
  location?: string;
}

/** GET /comment/hot and /comment/new. An empty thread answers 422 instead. */
export interface QqCommentsDto {
  code: 200;
  comments: QqCommentDto[];
  total?: number;
  more: boolean;
}

/** GET /comment/count. */
export interface QqCommentCountDto {
  code: 200;
  id: number;
  count: number;
}
