"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Loader2, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
import { getMusicComments, toggleLikeComments } from "@/lib/api/comment";
import { getSongDetail } from "@/lib/api/track";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseComment } from "@/types/api/music";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LIMIT = 20;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CommentPage() {
  const { t } = useI18n();
  // 歌曲相关信息
  const searchParams = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const songId = searchParams.get("SongId") || searchParams.get("songId");
  const [songInfo, setSongInfo] = useState<any>(null);
  const [albumCover, setAlbumCover] = useState(
    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop",
  );
  const [replyTarget, setReplyTarget] = useState<NeteaseComment | null>(null);

  // 分页与数据状态
  const [hotComments, setHotComments] = useState<NeteaseComment[]>([]);
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 🎯 输入面板状态
  const [isInputOpen, setIsInputOpen] = useState(false);
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const isLogin = useLoginStatus();

  // Router
  const smartRouter = useSmartRouter();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const routerClick = (url: string) => {
    smartRouter.push(url);
  };

  // 数据获取逻辑
  const fetchComments = useCallback(
    async (currentOffset: number) => {
      if (isLoading || !hasMore || !songId) return;
      setIsLoading(true);

      try {
        const res = await getMusicComments({ id: songId, limit: LIMIT, offset: currentOffset });
        if (currentOffset === 0 && res.data?.hotComments) {
          setHotComments(res.data.hotComments);
          // console.log("Fetched hot comments:", res.data.hotComments); // Debug log
        }
        setComments((prev) => {
          const fetchedComments = res.data?.comments || [];
          return currentOffset === 0 ? fetchedComments : [...prev, ...fetchedComments];
        });
        setTotal(res.data?.total || 0);
        setHasMore(res.data?.more || false);
        setOffset(currentOffset + LIMIT);
      } catch (error) {
        console.error("Failed to fetch comments", error);
        if (currentOffset === 0) {
          setComments([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [songId, hasMore, isLoading],
  );

  // 歌曲信息获取
  const fetchSongDetails = useCallback(async () => {
    if (!songId) return;
    try {
      const res = await getSongDetail(songId);
      if (res.data?.songs && res.data.songs.length > 0) {
        const song = res.data.songs[0];
        setSongInfo(song);
        if (song.al?.picUrl) {
          setAlbumCover(song.al.picUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch song details", error);
    }
  }, [songId]);

  const toggleLike = async (id: number, isHot: boolean) => {
    const targetSet = isHot ? setHotComments : setComments;
    targetSet((prev) =>
      prev.map((c) => {
        if (c.commentId === id) {
          const nextLiked = !c.liked;
          return {
            ...c,
            liked: nextLiked,
            likedCount: nextLiked ? c.likedCount + 1 : Math.max(0, c.likedCount - 1),
          };
        }
        return c;
      }),
    );

    const commentList = isHot ? hotComments : comments;
    const comment = commentList.find((c) => c.commentId === id);

    if (!comment || !songId) return;
    const nextType = comment.liked ? 0 : 1;
    try {
      await toggleLikeComments(songId, id, nextType, 0);
      // console.log("Like toggle response:", res); // Debug log
      toast.success(
        nextType === 1 ? t("comments.page.likeSuccess") : t("comments.page.unlikeSuccess"),
      );
    } catch (err: any) {
      toast.error(
        t("common.message.requestFailed", {
          message: err.data?.msg || t("common.meta.unknownUser"),
        }),
      );
      console.error("Failed to toggle like", err);
    }
  };

  const deleteComment = (id: number) => {
    if (!songId) return;
    import("@/lib/api/comment").then(({ delComments }) => {
      delComments(songId, id)
        .then(() => {
          setComments((prev) => prev.filter((c) => c.commentId !== id));
          setHotComments((prev) => prev.filter((c) => c.commentId !== id));
          toast.success(t("comments.page.deleted"));
        })
        .catch((err) => {
          toast.error(
            t("common.message.requestFailed", {
              message: err.data?.msg || t("common.meta.unknownUser"),
            }),
          );
          console.error("Failed to delete comment", err);
        });
    });
  };

  const replyComment = (id: number) => {
    const allComments = [...hotComments, ...comments];
    const target = allComments.find((c) => c.commentId === id);
    if (target) {
      setReplyTarget(target);
      setIsInputOpen(true);
    }
  };

  const handleSubmitText = async (text: string) => {
    if (!songId || !text.trim() || text.length > 140) return false;
    if (!isLogin) {
      toast.error(t("comments.page.loginRequired"));
      return false;
    }

    try {
      if (replyTarget) {
        const { replyComments } = await import("@/lib/api/comment");
        await replyComments(songId, replyTarget.commentId, text);
        toast.success(t("comments.page.replySuccess"));
      } else {
        const { addMusicComments } = await import("@/lib/api/comment");
        await addMusicComments(songId, text);
        toast.success(t("comments.page.publishSuccess"));
      }

      setReplyTarget(null);
      setIsInputOpen(false);

      setTimeout(() => {
        setOffset(0);
        setHasMore(true);
        fetchComments(0);
      }, 500);
      return true;
    } catch (err: any) {
      toast.error(
        t("common.message.requestFailed", {
          message: err.data?.msg || t("common.meta.unknownUser"),
        }),
      );
      console.error("Failed to submit comment", err);
      return false;
    }
  };

  // 🎯 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const isInsidePanel = inputPanelRef.current?.contains(target);
      const isInsideToggleBtn = toggleBtnRef.current?.contains(target);
      // Shadcn 弹窗会被注入到 data-radix-popper-content-wrapper 容器里
      const isInsidePopover = (target as Element).closest?.("[data-radix-popper-content-wrapper]");

      // 如果点击既不在面板里，也不在开关按钮上，也不在表情弹窗里，才关闭
      if (!isInsidePanel && !isInsideToggleBtn && !isInsidePopover) {
        setIsInputOpen(false);
      }
    };

    if (isInputOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isInputOpen]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Effect ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    fetchComments(0);
    fetchSongDetails();
  }, [fetchSongDetails, fetchComments]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchComments(offset);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchComments, hasMore, isLoading, offset]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white font-sans">
      {/* 沉浸式背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${albumCover})` }}
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/60 to-[#121212]/95 pointer-events-none" />

      {/* 主内容区 */}
      <div className="relative z-10 h-full overflow-y-auto scrollbar-hide mt-12">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* 头部：歌曲信息 */}
          <div className="flex items-center gap-10 mb-12">
            <Image
              width={168}
              height={168}
              src={albumCover}
              alt={t("album.coverAlt")}
              className="w-42 h-42 rounded-md shadow-2xl transition-all duration-700"
            />
            <div>
              <span className="px-2 py-1 text-xs font-bold bg-white/10 text-white rounded mb-3 inline-block">
                {t("comments.page.trackTag")}
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                {songInfo?.name || t("comments.page.loadingTrack")}
              </h1>
              <div className="text-sm text-[#B3B3B3] flex items-center gap-2">
                <span>
                  {t("common.label.album")}:{" "}
                  <span className="text-white hover:underline cursor-pointer">
                    {songInfo?.al?.name || "..."}
                  </span>
                </span>
                <span>•</span>
                <span>
                  {t("common.label.artists")}:{" "}
                  <span className="text-white hover:underline cursor-pointer">
                    {songInfo?.ar?.map((a: any) => a.name).join(" / ") || "..."}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 评论标题 */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold">
                {t("comments.page.allComments")}
                <span className="ml-1 text-sm font-normal text-[#B3B3B3]">
                  {total > 0 ? total.toLocaleString() : ""}
                </span>
              </h2>
            </div>
          </div>

          {/* 热评 */}
          {hotComments.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">
                {t("comments.page.hotComments")}
              </h3>
              <div className="space-y-6">
                {hotComments.map((comment) => (
                  <CommentItem
                    key={`hot-${comment.commentId}`}
                    comment={comment}
                    isHot={true}
                    onLike={toggleLike}
                    onDelete={deleteComment}
                    onReply={replyComment}
                    onRouterClick={routerClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 最新评论区 */}
          <div>
            <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">
              {t("comments.page.latestComments")}
            </h3>
            <div className="space-y-6">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem
                    key={`latest-${comment.commentId}`}
                    comment={comment}
                    isHot={false}
                    onLike={toggleLike}
                    onDelete={deleteComment}
                    onReply={replyComment}
                    onRouterClick={routerClick}
                  />
                ))
              ) : !isLoading ? (
                <div className="text-center py-20 text-[#B3B3B3]">
                  {t("comments.page.noComments")}
                </div>
              ) : null}
            </div>
          </div>

          {/* 触底加载指示器 */}
          <div ref={observerTarget} className="py-8 flex justify-center items-center">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-[#1DB954] animate-spin" />
            ) : hasMore ? (
              <span className="text-[#B3B3B3] text-sm">{t("comments.page.loadMore")}</span>
            ) : (
              <span className="text-[#B3B3B3] text-sm">{t("comments.page.end")}</span>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 右下角悬浮评论按钮 */}
      <button
        ref={toggleBtnRef}
        type="button"
        onClick={() => setIsInputOpen((prev) => !prev)}
        className="fixed bottom-28 right-6 z-40 flex items-center gap-2 px-3 py-3
        bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
      >
        <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* ━━━━━━━━━━━━━━━━━━━━ 🎯 顶部向下弹出非阻断面板 (强行对齐，不遮挡操作) ━━━━━━━━━━━━━━━━━━━━ */}

      <div
        className={`fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ease-out
          ${isInputOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        {/* 面板主体 */}
        <div
          ref={inputPanelRef}
          className="w-full max-w-4xl bg-[#1a1a1a]/95 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative pointer-events-auto"
        >
          {/* 增加了 pt-12 或者 pt-16 提供顶部安全呼吸区，解决拥挤太靠上的问题 */}
          <div className="px-6 pt-8 md:pt-9">
            {/* 面板头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">
                  {replyTarget ? t("comments.page.replyComment") : t("comments.page.addComment")}
                </h3>
                {replyTarget && (
                  <span className="text-sm text-[#1DB954]">@{replyTarget.user?.nickname}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInputOpen(false);
                  setReplyTarget(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={t("common.action.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 回复提示 */}
            {replyTarget && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg flex items-start gap-3">
                <div className="flex-1 text-sm">
                  <span className="text-[#B3B3B3]">{t("comments.page.replyingTo")}</span>
                  <span className="text-white line-clamp-2">{replyTarget.content}</span>
                </div>
                <button
                  onClick={() => setReplyTarget(null)}
                  className="text-[#B3B3B3] hover:text-white shrink-0"
                  title={t("comments.input.cancel")}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 输入框 */}
            <CommentInputBox
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onSubmit={handleSubmitText}
            />
          </div>

          {/* 底部装饰条 */}
          <div className="flex justify-center pb-3 pt-1">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
