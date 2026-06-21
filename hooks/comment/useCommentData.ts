import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getMusicComments, toggleLikeComments } from "@/lib/api/comment";
import { getSongDetail } from "@/lib/api/track";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseComment } from "@/types/api/music";

const LIMIT = 20;

export function useCommentData() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const songId = searchParams.get("SongId") || searchParams.get("songId");

  const [songInfo, setSongInfo] = useState<any>(null);
  const [albumCover, setAlbumCover] = useState("");
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);

  // Fetch song info and comments
  useEffect(() => {
    if (!songId) return;
    setIsLoading(true);
    Promise.all([
      getSongDetail(songId as string),
      getMusicComments({ id: songId as string, limit: LIMIT, offset: 0 }),
    ]).then(([songRes, commentRes]) => {
      const song = songRes?.data?.songs?.[0];
      setSongInfo(song);
      if (song?.al?.picUrl) setAlbumCover(song.al.picUrl);
      const data = commentRes?.data;
      setHotComments(data?.hotComments || []);
      setComments(data?.comments || []);
      setTotal(data?.total || 0);
      setOffset(LIMIT);
      setHasMore(data?.more || false);
    }).catch((err) => {
      console.error("Failed to load comments:", err);
      toast.error(t("common.message.requestFailed", { message: "" }));
    }).finally(() => setIsLoading(false));
  }, [songId, t]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!songId || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const res = await getMusicComments({ id: songId as string, limit: LIMIT, offset });
      const data = res?.data;
      if (data?.comments) {
        setComments((prev) => [...prev, ...data.comments]);
        setOffset((prev) => prev + LIMIT);
        setHasMore(data.more || false);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, [songId, hasMore, isLoading, offset]);

  const handleLike = useCallback(async (commentId: number, liked: boolean, isHot: boolean) => {
    try {
      await toggleLikeComments(songId as string, commentId, liked ? 0 : 1, 0);
      const toggle = (c: NeteaseComment) =>
        c.commentId === commentId
          ? { ...c, liked: !c.liked, likedCount: c.likedCount! + (c.liked ? -1 : 1) }
          : c;
      if (isHot) setHotComments((prev) => prev.map(toggle));
      else setComments((prev) => prev.map(toggle));
    } catch { toast.error(t("common.message.requestFailed", { message: "" })); }
  }, [songId, t]);

  const handleDelete = useCallback(async (commentId: number) => {
    setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    setHotComments((prev) => prev.filter((c) => c.commentId !== commentId));
    toast.success(t("comments.page.deleted"));
  }, [t]);

  return {
    songId, songInfo, albumCover, replyTarget, setReplyTarget,
    hotComments, comments, total, hasMore, isLoading, isInputOpen, setIsInputOpen,
    loadMore, handleLike, handleDelete,
  };
}
