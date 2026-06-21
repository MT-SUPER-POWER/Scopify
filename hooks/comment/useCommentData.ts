import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addMusicComments,
  delComments,
  getMusicComments,
  replyComments,
  toggleLikeComments,
} from "@/lib/api/comment";
import { getSongDetail } from "@/lib/api/track";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseComment, SongComment, SongDetail } from "@/types/api/music";
import type { PlaylistInfo } from "@/types/playlist";

const LIMIT = 20;
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

export function useCommentData() {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const searchParams = useSearchParams();
  const songId = searchParams.get("SongId") || searchParams.get("songId");

  const [songInfo, setSongInfo] = useState<SongDetail | null>(null);
  const [albumCover, setAlbumCover] = useState(FALLBACK_COVER);
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);

  const updateCommentPage = useCallback((data: SongComment | undefined, currentOffset: number) => {
    const fetchedComments = data?.comments || [];

    if (currentOffset === 0) {
      setHotComments(data?.hotComments || []);
      setComments(fetchedComments);
    } else {
      setComments((prev) => [...prev, ...fetchedComments]);
    }

    setTotal(data?.total || 0);
    setOffset(currentOffset + LIMIT);
    setHasMore(data?.more || false);
  }, []);

  const fetchComments = useCallback(
    async (currentOffset = 0) => {
      if (!songId) return;
      setIsLoading(true);
      try {
        const res = await getMusicComments({ id: songId, limit: LIMIT, offset: currentOffset });
        updateCommentPage(res?.data as SongComment | undefined, currentOffset);
      } catch (err) {
        console.error("Failed to load comments:", err);
        if (currentOffset === 0) {
          setHotComments([]);
          setComments([]);
        }
        toast.error(t("common.message.requestFailed", { message: "" }));
      } finally {
        setIsLoading(false);
      }
    },
    [songId, t, updateCommentPage],
  );

  useEffect(() => {
    if (!songId) return;

    setOffset(0);
    setHasMore(true);
    setReplyTarget(null);
    setIsInputOpen(false);
    setIsLoading(true);

    Promise.all([getSongDetail(songId), getMusicComments({ id: songId, limit: LIMIT, offset: 0 })])
      .then(([songRes, commentRes]) => {
        const song = songRes?.data?.songs?.[0] as SongDetail | undefined;
        setSongInfo(song || null);
        setAlbumCover(song?.al?.picUrl || FALLBACK_COVER);
        updateCommentPage(commentRes?.data as SongComment | undefined, 0);
      })
      .catch((err) => {
        console.error("Failed to load comment page:", err);
        toast.error(t("common.message.requestFailed", { message: "" }));
      })
      .finally(() => setIsLoading(false));
  }, [songId, t, updateCommentPage]);

  const loadMore = useCallback(async () => {
    if (!songId || !hasMore || isLoading) return;
    await fetchComments(offset);
  }, [fetchComments, hasMore, isLoading, offset, songId]);

  const handleLike = useCallback(
    async (commentId: number, isHot: boolean) => {
      if (!songId) return;

      const source = isHot ? hotComments : comments;
      const target =
        source.find((comment) => comment.commentId === commentId) ??
        hotComments.find((comment) => comment.commentId === commentId) ??
        comments.find((comment) => comment.commentId === commentId);
      if (!target) return;

      try {
        await toggleLikeComments(songId, commentId, target.liked ? 0 : 1, 0);
        const toggle = (comment: NeteaseComment) => {
          if (comment.commentId !== commentId) return comment;
          const liked = !comment.liked;
          const likedCount = Math.max(0, comment.likedCount + (liked ? 1 : -1));
          return { ...comment, liked, likedCount };
        };
        setHotComments((prev) => prev.map(toggle));
        setComments((prev) => prev.map(toggle));
        toast.success(
          target.liked ? t("comments.page.unlikeSuccess") : t("comments.page.likeSuccess"),
        );
      } catch (err) {
        console.error("Failed to toggle comment like:", err);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [comments, hotComments, songId, t],
  );

  const handleDelete = useCallback(
    async (commentId: number) => {
      if (!songId) return;
      try {
        await delComments(songId, commentId);
        setComments((prev) => prev.filter((comment) => comment.commentId !== commentId));
        setHotComments((prev) => prev.filter((comment) => comment.commentId !== commentId));
        toast.success(t("comments.page.deleted"));
      } catch (err) {
        console.error("Failed to delete comment:", err);
        toast.error(t("common.message.requestFailed", { message: "" }));
      }
    },
    [songId, t],
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
      if (!songId || !text.trim() || text.length > 140) return false;
      if (!isLogin) {
        toast.error(t("comments.page.loginRequired"));
        return false;
      }

      try {
        if (replyTarget) {
          await replyComments(songId, replyTarget.commentId, text);
          toast.success(t("comments.page.replySuccess"));
        } else {
          await addMusicComments(songId, text);
          toast.success(t("comments.page.publishSuccess"));
        }

        setReplyTarget(null);
        setIsInputOpen(false);
        await fetchComments(0);
        return true;
      } catch (err) {
        console.error("Failed to submit comment:", err);
        toast.error(t("common.message.requestFailed", { message: "" }));
        return false;
      }
    },
    [fetchComments, isLogin, replyTarget, songId, t],
  );

  const commentHeaderInfo = useMemo<PlaylistInfo>(() => {
    const artists = songInfo?.ar
      ?.map((artist) => artist.name)
      .filter(Boolean)
      .join(" / ");
    const primaryArtist = songInfo?.ar?.[0];
    const albumName = songInfo?.al?.name;

    return {
      isSpecial: false,
      privacy: t("comments.page.trackTag"),
      tags: albumName ? [albumName] : [],
      title: songInfo?.name || t("comments.page.loadingTrack"),
      cover: albumCover,
      createTime: albumName || "",
      creator: artists || t("common.meta.unknownUser"),
      creatorID: primaryArtist?.id ?? null,
      creatorHref: primaryArtist?.id ? `/artist?id=${primaryArtist.id}` : undefined,
      creatorAvatar: "",
      likes: total,
      totalSongs: 1,
      createTimeLabel: albumName ? `${t("common.label.album")}: ${albumName}` : "",
      likesLabel:
        total > 0
          ? `${t("comments.page.allComments")}: ${total.toLocaleString()}`
          : t("comments.page.allComments"),
      totalSongsLabel: t("comments.page.trackTag"),
    };
  }, [albumCover, songInfo, t, total]);

  return {
    songId,
    songInfo,
    albumCover,
    commentHeaderInfo,
    replyTarget,
    setReplyTarget,
    hotComments,
    comments,
    total,
    hasMore,
    isLoading,
    isInputOpen,
    setIsInputOpen,
    loadMore,
    handleLike,
    handleDelete,
    handleReply,
    handleSubmitComment,
  };
}
