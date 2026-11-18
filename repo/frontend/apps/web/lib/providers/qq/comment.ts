import type {
  MusicCommentPage,
  MusicCommentSource,
  MusicCommentTarget,
  MusicCommentTargetKind,
} from "@scopify/music-domain/comment";

import { qqAlbumCoverUrl } from "@/lib/providers/qq/adapters/playlist";
import { adaptQqCommentPage, EMPTY_QQ_COMMENT_PAGE } from "@/lib/providers/qq/adapters/comment";
import { getQqSongCommentCount, getQqSongComments } from "@/lib/providers/qq/api/comment";
import { getQqSongBatch } from "@/lib/providers/qq/api/track";
import { resolveQqSongId } from "@/lib/providers/qq/songId";
import { isApiError } from "@/lib/web/apiError";

/** The backend reads song threads only. */
const QQ_COMMENT_TARGET_KINDS: ReadonlySet<MusicCommentTargetKind> = new Set(["track"]);

function requireSong(target: MusicCommentTarget): string {
  if (target.kind !== "track") throw new Error(`QQ has no comments on a ${target.kind}`);
  return target.id;
}

/** The backend answers an empty thread with 422 rather than an empty list. */
async function readPage(
  kind: "hot" | "new",
  mid: string,
  page: { offset: number; limit: number },
  signal?: AbortSignal,
): Promise<MusicCommentPage> {
  const songId = await resolveQqSongId(mid, signal);
  try {
    return adaptQqCommentPage(await getQqSongComments(kind, songId, page, signal));
  } catch (error) {
    if (isApiError(error) && error.status === 422) return EMPTY_QQ_COMMENT_PAGE;
    throw error;
  }
}

export const qqCommentSource: MusicCommentSource = {
  commentTargetKinds: QQ_COMMENT_TARGET_KINDS,

  getComments(target, request) {
    return readPage(
      request.sort === "hot" ? "hot" : "new",
      requireSong(target),
      { offset: (request.pageNo - 1) * request.pageSize, limit: request.pageSize },
      request.signal,
    );
  },

  async getCommentCount(target, signal) {
    const mid = requireSong(target);
    const songId = await resolveQqSongId(mid, signal);
    const { count } = await getQqSongCommentCount(songId, signal);
    if (count > 0) return count;
    // The count route has answered 0 for threads that do have comments; the list knows its total.
    const page = await readPage("new", mid, { offset: 0, limit: 1 }, signal);
    return page.total ?? page.comments.length;
  },

  async getHotComments(target, limit, signal) {
    const mid = requireSong(target);
    const hot = await readPage("hot", mid, { offset: 0, limit }, signal);
    const page =
      hot.comments.length > 0 ? hot : await readPage("new", mid, { offset: 0, limit }, signal);
    return {
      comments: page.comments.slice(0, limit),
      total: page.total ?? page.comments.length,
    };
  },

  async getCommentTargetHeader(target, signal) {
    const mid = requireSong(target);
    const data = await getQqSongBatch([mid], signal);
    const entry = data.results[0];
    if (!entry || entry.code !== 200 || !("song" in entry)) {
      throw new Error(`QQ song ${mid} could not be read`);
    }
    const { song } = entry;
    return {
      title: song.name,
      subtitle: song.album.name || null,
      coverUrl: qqAlbumCoverUrl(song.album.mid),
      artists: song.singer.map((artist) => ({
        id: artist.mid,
        name: artist.name,
        avatarUrl: null,
      })),
    };
  },
};
