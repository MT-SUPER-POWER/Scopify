"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getAritstDetail } from "@/lib/api/artist";
import { getAlbumDetail } from "@/lib/api/album";
import { getMVDetail } from "@/lib/api/mv";
import { getMvCover } from "@/lib/music/mvCover";
import {
  addResourceComment,
  delComments,
  getFloorComments,
  getNewComments,
  replyComments,
  toggleLikeComments,
} from "@/lib/api/comment";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRadioDetail, getRadioProgramDetail } from "@/lib/api/radio";
import { getSongDetail } from "@/lib/api/track";
import { getVoiceDetail } from "@/lib/api/voicelist";
import {
  getReplyCount,
  normalizeFloorComments,
  normalizeNewComments,
  resolveCommentResource,
} from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import {
  COMMENT_RESOURCE_TYPE,
  type CommentResourceKind,
  type CommentResourceRef,
} from "@/types/comment/api";
import type { NeteaseComment, SongDetail } from "@/types/song/api";
import type {
  CommentResourceHeaderData,
  CommentSortType,
  CommentThread,
} from "@/types/comment/model";

const LIMIT = 20;
const REPLY_LIMIT = 5;
const REPLY_MORE_LIMIT = 10;
/** /comment/new 的 sortType：1 推荐（热度在前），3 按时间。 */
const SORT_TYPE = { hot: 1, latest: 3 } as const;
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
const artistAvatarCache = new Map<string, string>();

function getArtistAvatar(source: Record<string, unknown> | undefined) {
  for (const key of ["avatar", "avatarUrl", "img1v1Url", "picUrl", "cover"]) {
    const value = source?.[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

async function getSongHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getSongDetail(resourceId);
  const song = response.data?.songs?.[0] as SongDetail | undefined;
  const artists = await Promise.all(
    (song?.ar ?? []).map(async (artist) => {
      const cacheKey = String(artist.id);
      let avatarUrl = artistAvatarCache.get(cacheKey) ?? "";
      if (!avatarUrl) {
        try {
          const artistResponse = await getAritstDetail(artist.id);
          avatarUrl = getArtistAvatar(
            artistResponse.data?.data?.artist as unknown as Record<string, unknown> | undefined,
          );
          if (avatarUrl) artistAvatarCache.set(cacheKey, avatarUrl);
        } catch {
          // Artist artwork is supplementary; comments remain usable without it.
        }
      }
      return { avatarUrl, id: artist.id, name: artist.name };
    }),
  );

  return {
    albumName: song?.al?.name,
    artists,
    coverUrl: song?.al?.picUrl || FALLBACK_COVER,
    title: song?.name ?? "",
  };
}

async function getPlaylistHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getPlaylsitDetail({ id: resourceId });
  const playlist = response.data?.playlist;
  return {
    albumName: playlist?.creator?.nickname,
    artists: [],
    coverUrl: playlist?.coverImgUrl ?? playlist?.picUrl ?? FALLBACK_COVER,
    title: playlist?.name ?? "",
  };
}

async function getAlbumHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getAlbumDetail(resourceId);
  const album = response.data?.album;
  const artists = album?.artists ?? (album?.artist ? [album.artist] : []);
  return {
    artists: artists.map((artist) => ({
      avatarUrl: artist.picUrl ?? artist.img1v1Url ?? "",
      id: artist.id ?? "",
      name: artist.name ?? "",
    })),
    coverUrl: album?.picUrl ?? album?.blurPicUrl ?? FALLBACK_COVER,
    title: album?.name ?? "",
  };
}

async function getVoiceHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  try {
    const response = await getRadioProgramDetail(resourceId);
    const program = response.data?.program;
    if (program) {
      return {
        albumName: program.radio?.name ?? program.dj?.nickname,
        artists: [],
        coverUrl: program.coverUrl ?? FALLBACK_COVER,
        title: program.name ?? program.mainSong?.name ?? "",
      };
    }
  } catch {
    // New Voice resources can fall back to the login-aware detail endpoint.
  }

  const response = await getVoiceDetail(resourceId);
  const voice = response.data?.data;
  return {
    artists: [],
    coverUrl: voice?.coverUrl || FALLBACK_COVER,
    title: voice?.name ?? "",
  };
}

async function getVoiceListHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const response = await getRadioDetail(resourceId);
  const payload = response.data?.data;
  const radio = payload && "id" in payload ? payload : payload?.djRadio;
  return {
    albumName: radio?.dj?.nickname,
    artists: [],
    coverUrl: radio?.picUrl ?? FALLBACK_COVER,
    title: radio?.name ?? "",
  };
}

async function getMvHeader(resourceId: string): Promise<CommentResourceHeaderData> {
  const mv = (await getMVDetail(resourceId)).data?.data;
  const artists = mv?.artists?.length
    ? mv.artists
    : mv?.artistId
      ? [{ id: mv.artistId, name: mv.artistName ?? "" }]
      : [];
  return {
    artists: artists.map((artist) => ({
      avatarUrl: "img1v1Url" in artist ? (artist.img1v1Url ?? "") : "",
      id: artist.id,
      name: artist.name,
    })),
    coverUrl: (mv && getMvCover(mv)) || FALLBACK_COVER,
    title: mv?.name ?? "",
  };
}

function getResourceHeader(kind: CommentResourceKind, resourceId: string) {
  switch (kind) {
    case "mv":
      return getMvHeader(resourceId);
    case "album":
      return getAlbumHeader(resourceId);
    case "playlist":
      return getPlaylistHeader(resourceId);
    case "voice":
      return getVoiceHeader(resourceId);
    case "voice-list":
      return getVoiceListHeader(resourceId);
    default:
      return getSongHeader(resourceId);
  }
}

function mergeUnique(previous: NeteaseComment[], next: NeteaseComment[]) {
  const seen = new Set(previous.map((comment) => comment.commentId));
  return [...previous, ...next.filter((comment) => !seen.has(comment.commentId))];
}

function toggleLiked(comment: NeteaseComment): NeteaseComment {
  const liked = !comment.liked;
  return { ...comment, liked, likedCount: Math.max(0, comment.likedCount + (liked ? 1 : -1)) };
}

/**
 * 评论列表、楼中楼回复、点赞与发表。不传 resourceRef 时从评论页 URL 解析资源；
 * 嵌入在其他页面（如 MV 页）时直接传入资源。列表走 /comment/new，因为只有它带回复数。
 */
export function useCommentData(resourceRef?: CommentResourceRef) {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const searchParams = useSearchParams();
  const refKind = resourceRef?.kind;
  const refId = resourceRef?.id;
  const resource = useMemo(
    () =>
      refKind && refId
        ? { id: refId, kind: refKind, type: COMMENT_RESOURCE_TYPE[refKind] }
        : resolveCommentResource(
            searchParams.get("resource"),
            searchParams.get("id"),
            searchParams.get("SongId") || searchParams.get("songId"),
          ),
    [refId, refKind, searchParams],
  );

  const [headerData, setHeaderData] = useState<CommentResourceHeaderData>({
    artists: [],
    coverUrl: FALLBACK_COVER,
    title: "",
  });
  const [sort, setSort] = useState<CommentSortType>("hot");
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [threads, setThreads] = useState<Record<number, CommentThread>>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cursor, setCursor] = useState<number | string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // 头部资源信息和第一页评论各自的首次加载状态，用来显示骨架而不是占位文字
  const [isHeaderLoading, setIsHeaderLoading] = useState(true);
  const [isFirstPageLoading, setIsFirstPageLoading] = useState(true);
  // 切换排序或资源后，晚到的旧请求结果直接丢弃
  const requestRef = useRef(0);
  const threadsRef = useRef(threads);
  threadsRef.current = threads;
  const loadingThreadsRef = useRef(new Set<number>());
  // 回复的是哪一层楼的评论，发表成功后据此刷新那一层
  const replyRootRef = useRef<number | null>(null);

  const fetchComments = useCallback(
    async (currentOffset = 0, currentCursor?: number | string) => {
      if (!resource) return;
      const requestId = ++requestRef.current;
      setIsLoading(true);
      try {
        const page = normalizeNewComments(
          (
            await getNewComments({
              cursor: currentCursor,
              id: resource.id,
              pageNo: currentOffset / LIMIT + 1,
              pageSize: LIMIT,
              sortType: SORT_TYPE[sort],
              type: resource.type,
            })
          ).data,
        );
        if (requestId !== requestRef.current) return;
        setComments((previous) =>
          currentOffset === 0 ? page.comments : mergeUnique(previous, page.comments),
        );
        setTotal(page.total);
        setOffset(currentOffset + LIMIT);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        console.error("Failed to load comments:", error);
        if (currentOffset === 0) setComments([]);
        toast.error(t("common.message.requestFailed", { message: "" }));
      } finally {
        if (requestId === requestRef.current) {
          setIsLoading(false);
          if (currentOffset === 0) setIsFirstPageLoading(false);
        }
      }
    },
    [resource, sort, t],
  );

  useEffect(() => {
    if (!resource) return;
    setIsFirstPageLoading(true);
    setOffset(0);
    setCursor(undefined);
    setHasMore(true);
    setReplyTarget(null);
    setThreads({});
    void fetchComments(0);
  }, [fetchComments, resource]);

  useEffect(() => {
    if (!resource) return;
    let ignore = false;

    setHeaderData({ artists: [], coverUrl: FALLBACK_COVER, title: "" });
    setIsHeaderLoading(true);
    void getResourceHeader(resource.kind, resource.id)
      .then((nextHeader) => {
        if (!ignore) setHeaderData(nextHeader);
      })
      .catch((error) => console.error("Failed to load comment resource header:", error))
      .finally(() => {
        if (!ignore) setIsHeaderLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [resource]);

  const loadMore = useCallback(async () => {
    if (!resource || !hasMore || isLoading) return;
    await fetchComments(offset, cursor);
  }, [cursor, fetchComments, hasMore, isLoading, offset, resource]);

  const patchThread = useCallback((parentId: number, patch: Partial<CommentThread>) => {
    setThreads((previous) => ({
      ...previous,
      [parentId]: {
        comments: [],
        hasMore: false,
        isLoading: false,
        loaded: false,
        total: 0,
        ...previous[parentId],
        ...patch,
      },
    }));
  }, []);

  /** 取一层楼的回复：默认取首页，more 为 true 时接着往后取。已取过的首页不会重复请求。 */
  const loadReplies = useCallback(
    async (parentId: number, more = false) => {
      if (!resource || loadingThreadsRef.current.has(parentId)) return;
      const existing = threadsRef.current[parentId];
      if (more ? !existing?.hasMore : existing?.loaded) return;

      loadingThreadsRef.current.add(parentId);
      patchThread(parentId, { isLoading: true });
      try {
        const page = normalizeFloorComments(
          (
            await getFloorComments({
              id: resource.id,
              limit: more ? REPLY_MORE_LIMIT : REPLY_LIMIT,
              parentCommentId: parentId,
              time: more ? existing?.time : undefined,
              type: resource.type,
            })
          ).data,
        );
        setThreads((previous) => ({
          ...previous,
          [parentId]: {
            comments: mergeUnique(more ? (previous[parentId]?.comments ?? []) : [], page.comments),
            hasMore: page.hasMore,
            isLoading: false,
            loaded: true,
            time: page.time,
            total: page.total,
          },
        }));
      } catch (error) {
        console.error("Failed to load comment replies:", error);
        patchThread(parentId, { isLoading: false });
        toast.error(t("common.message.requestFailed", { message: "" }));
      } finally {
        loadingThreadsRef.current.delete(parentId);
      }
    },
    [patchThread, resource, t],
  );

  const handleLike = useCallback(
    async (commentId: number) => {
      if (!resource) return;
      const target =
        comments.find((comment) => comment.commentId === commentId) ??
        Object.values(threadsRef.current)
          .flatMap((thread) => thread.comments)
          .find((comment) => comment.commentId === commentId);
      if (!target) return;

      try {
        await toggleLikeComments(resource.id, commentId, target.liked ? 0 : 1, resource.type);
        const toggle = (comment: NeteaseComment) =>
          comment.commentId === commentId ? toggleLiked(comment) : comment;
        setComments((previous) => previous.map(toggle));
        setThreads((previous) =>
          Object.fromEntries(
            Object.entries(previous).map(([key, thread]) => [
              key,
              { ...thread, comments: thread.comments.map(toggle) },
            ]),
          ),
        );
        toast.success(
          target.liked ? t("comments.page.unlikeSuccess") : t("comments.page.likeSuccess"),
        );
      } catch (error) {
        console.error("Failed to toggle comment like:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [comments, resource, t],
  );

  const handleDelete = useCallback(
    async (commentId: number) => {
      if (!resource) return;
      try {
        await delComments(resource.id, commentId, resource.type);
        const rootId = Object.entries(threadsRef.current).find(([, thread]) =>
          thread.comments.some((comment) => comment.commentId === commentId),
        )?.[0];
        setComments((previous) =>
          previous
            .filter((comment) => comment.commentId !== commentId)
            .map((comment) =>
              String(comment.commentId) === rootId
                ? {
                    ...comment,
                    showFloorComment: { replyCount: Math.max(0, getReplyCount(comment) - 1) },
                  }
                : comment,
            ),
        );
        setThreads((previous) =>
          Object.fromEntries(
            Object.entries(previous)
              .filter(([key]) => key !== String(commentId))
              .map(([key, thread]) => {
                const remaining = thread.comments.filter(
                  (comment) => comment.commentId !== commentId,
                );
                const removed = remaining.length !== thread.comments.length;
                return [
                  key,
                  { ...thread, comments: remaining, total: thread.total - (removed ? 1 : 0) },
                ];
              }),
          ),
        );
        toast.success(t("comments.page.deleted"));
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [resource, t],
  );

  /** rootId 是被回复评论所在那层楼的根评论；回复顶层评论时就是它自己。 */
  const handleReply = useCallback((comment: NeteaseComment, rootId = comment.commentId) => {
    replyRootRef.current = rootId;
    setReplyTarget(comment);
  }, []);

  const handleSubmitComment = useCallback(
    async (text: string) => {
      if (!resource || !text.trim() || text.length > 140) return false;
      if (!isLogin) {
        toast.error(t("comments.page.loginRequired"));
        return false;
      }

      try {
        if (replyTarget) {
          await replyComments(resource.id, replyTarget.commentId, text, resource.type);
          toast.success(t("comments.page.replySuccess"));
          const rootId = replyRootRef.current;
          if (rootId !== null) {
            setThreads((previous) => {
              const next = { ...previous };
              delete next[rootId];
              return next;
            });
          }
        } else {
          await addResourceComment(resource.id, text, resource.type);
          toast.success(t("comments.page.publishSuccess"));
        }
        setReplyTarget(null);
        await fetchComments(0);
        return true;
      } catch (error) {
        console.error("Failed to submit comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
        return false;
      }
    },
    [fetchComments, isLogin, replyTarget, resource, t],
  );

  const commentHeaderInfo = useMemo(
    () => ({
      albumName: headerData.albumName,
      artists: headerData.artists,
      tagLabel: t(`comments.page.${resource?.kind ?? "song"}Tag`),
      title: headerData.title || t("comments.page.loadingResource"),
      total,
    }),
    [headerData, resource?.kind, t, total],
  );

  return {
    albumCover: headerData.coverUrl,
    total,
    commentHeaderInfo,
    comments,
    handleDelete,
    handleLike,
    handleReply,
    handleSubmitComment,
    hasMore,
    isFirstPageLoading,
    isHeaderLoading,
    isLoading,
    loadMore,
    loadReplies,
    replyTarget,
    resourceId: resource?.id ?? null,
    setReplyTarget,
    setSort,
    sort,
    threads,
  };
}
