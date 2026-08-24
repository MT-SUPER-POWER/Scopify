"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getAritstDetail } from "@/lib/api/artist";
import { getAlbumDetail } from "@/lib/api/album";
import {
  addResourceComment,
  delComments,
  getAlbumComments,
  getMusicComments,
  getNewComments,
  getPlaylistComments,
  getVoiceComments,
  replyComments,
  toggleLikeComments,
} from "@/lib/api/comment";
import { getPlaylsitDetail } from "@/lib/api/playlist";
import { getRadioDetail, getRadioProgramDetail } from "@/lib/api/radio";
import { getSongDetail } from "@/lib/api/track";
import { getVoiceDetail } from "@/lib/api/voicelist";
import {
  normalizeLegacyComments,
  normalizeNewComments,
  resolveCommentResource,
} from "@/lib/comment/commentResource";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import type { CommentResourceKind } from "@/types/api/comment";
import type { NeteaseComment, SongDetail } from "@/types/api/music";
import type { CommentResourceHeaderData } from "@/types/comment";

const LIMIT = 20;
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

function getResourceHeader(kind: CommentResourceKind, resourceId: string) {
  switch (kind) {
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

export function useCommentData() {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const searchParams = useSearchParams();
  const resource = useMemo(
    () =>
      resolveCommentResource(
        searchParams.get("resource"),
        searchParams.get("id"),
        searchParams.get("SongId") || searchParams.get("songId"),
      ),
    [searchParams],
  );

  const [headerData, setHeaderData] = useState<CommentResourceHeaderData>({
    artists: [],
    coverUrl: FALLBACK_COVER,
    title: "",
  });
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cursor, setCursor] = useState<number | string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);

  const fetchComments = useCallback(
    async (currentOffset = 0, currentCursor?: number | string) => {
      if (!resource) return;
      setIsLoading(true);
      try {
        const params = { id: resource.id, limit: LIMIT, offset: currentOffset };
        const page =
          resource.kind === "voice-list"
            ? normalizeNewComments(
                (
                  await getNewComments({
                    cursor: currentCursor,
                    id: resource.id,
                    pageNo: currentOffset / LIMIT + 1,
                    pageSize: LIMIT,
                    sortType: 3,
                    type: resource.type,
                  })
                ).data,
              )
            : normalizeLegacyComments(
                (
                  await (resource.kind === "album"
                    ? getAlbumComments(params)
                    : resource.kind === "playlist"
                      ? getPlaylistComments(params)
                      : resource.kind === "voice"
                        ? getVoiceComments(params)
                        : getMusicComments(params))
                ).data,
              );

        setHotComments(currentOffset === 0 ? page.hotComments : (previous) => previous);
        setComments((previous) =>
          currentOffset === 0 ? page.comments : [...previous, ...page.comments],
        );
        setTotal(page.total);
        setOffset(currentOffset + LIMIT);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      } catch (error) {
        console.error("Failed to load comments:", error);
        if (currentOffset === 0) {
          setHotComments([]);
          setComments([]);
        }
        toast.error(t("common.message.requestFailed", { message: "" }));
      } finally {
        setIsLoading(false);
      }
    },
    [resource, t],
  );

  useEffect(() => {
    if (!resource) return;
    let ignore = false;

    setHeaderData({ artists: [], coverUrl: FALLBACK_COVER, title: "" });
    setOffset(0);
    setCursor(undefined);
    setHasMore(true);
    setReplyTarget(null);
    setIsInputOpen(false);
    void fetchComments(0);
    void getResourceHeader(resource.kind, resource.id)
      .then((nextHeader) => {
        if (!ignore) setHeaderData(nextHeader);
      })
      .catch((error) => console.error("Failed to load comment resource header:", error));

    return () => {
      ignore = true;
    };
  }, [fetchComments, resource]);

  const loadMore = useCallback(async () => {
    if (!resource || !hasMore || isLoading) return;
    await fetchComments(offset, cursor);
  }, [cursor, fetchComments, hasMore, isLoading, offset, resource]);

  const handleLike = useCallback(
    async (commentId: number, isHot: boolean) => {
      if (!resource) return;
      const source = isHot ? hotComments : comments;
      const target =
        source.find((comment) => comment.commentId === commentId) ??
        hotComments.find((comment) => comment.commentId === commentId) ??
        comments.find((comment) => comment.commentId === commentId);
      if (!target) return;

      try {
        await toggleLikeComments(resource.id, commentId, target.liked ? 0 : 1, resource.type);
        const toggle = (comment: NeteaseComment) => {
          if (comment.commentId !== commentId) return comment;
          const liked = !comment.liked;
          return {
            ...comment,
            liked,
            likedCount: Math.max(0, comment.likedCount + (liked ? 1 : -1)),
          };
        };
        setHotComments((previous) => previous.map(toggle));
        setComments((previous) => previous.map(toggle));
        toast.success(
          target.liked ? t("comments.page.unlikeSuccess") : t("comments.page.likeSuccess"),
        );
      } catch (error) {
        console.error("Failed to toggle comment like:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [comments, hotComments, resource, t],
  );

  const handleDelete = useCallback(
    async (commentId: number) => {
      if (!resource) return;
      try {
        await delComments(resource.id, commentId, resource.type);
        setComments((previous) => previous.filter((comment) => comment.commentId !== commentId));
        setHotComments((previous) => previous.filter((comment) => comment.commentId !== commentId));
        toast.success(t("comments.page.deleted"));
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [resource, t],
  );

  const handleReply = useCallback(
    (commentId: number) => {
      const target = [...hotComments, ...comments].find(
        (comment) => comment.commentId === commentId,
      );
      if (!target) return;
      setReplyTarget(target);
      setIsInputOpen(true);
    },
    [comments, hotComments],
  );

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
        } else {
          await addResourceComment(resource.id, text, resource.type);
          toast.success(t("comments.page.publishSuccess"));
        }
        setReplyTarget(null);
        setIsInputOpen(false);
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
    commentHeaderInfo,
    comments,
    handleDelete,
    handleLike,
    handleReply,
    handleSubmitComment,
    hasMore,
    hotComments,
    isInputOpen,
    isLoading,
    loadMore,
    replyTarget,
    resourceId: resource?.id ?? null,
    setIsInputOpen,
    setReplyTarget,
  };
}
