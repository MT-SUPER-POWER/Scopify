"use client";

import { Loader2, MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
import PlaylistHeader from "@/components/Playlist/Header";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

export default function CommentPage() {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const currentUserId = useUserStore((state) => state.user?.userId ?? null);
  const smartRouter = useSmartRouter();
  const observerTarget = useRef<HTMLDivElement>(null);
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const {
    songId,
    albumCover,
    commentHeaderInfo,
    replyTarget,
    setReplyTarget,
    hotComments,
    comments,
    hasMore,
    isLoading,
    isInputOpen,
    setIsInputOpen,
    loadMore,
    handleLike,
    handleDelete,
    handleReply,
    handleSubmitComment,
  } = useCommentData();

  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    if (!isInputOpen) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInsidePanel = inputPanelRef.current?.contains(target);
      const isInsideToggleButton = toggleBtnRef.current?.contains(target);
      const isInsidePopover = target.closest?.("[data-radix-popper-content-wrapper]");

      if (!isInsidePanel && !isInsideToggleButton && !isInsidePopover) {
        setIsInputOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isInputOpen, setIsInputOpen]);

  if (!songId) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#121212] text-zinc-400 gap-4 p-8">
        <MessageCircle className="w-16 h-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#121212] font-sans text-white pb-12">
      <div
        className="absolute top-0 left-0 right-0 h-100 md:h-125 z-0 pointer-events-none opacity-60 bg-cover bg-center blur-3xl scale-110"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.25), #121212), url(${albumCover})`,
        }}
      />

      <PlaylistHeader info={commentHeaderInfo} isDaily={false} />

      <div className="relative z-10 flex flex-col bg-linear-to-b from-black/20 via-[#121212] to-[#121212] via-20%">
        <div className="max-w-4xl w-full mx-auto px-6 py-6">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-xl font-bold">{t("comments.page.allComments")}</h2>
          </div>

          {hotComments.length > 0 && (
            <section className="mb-10">
              <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">
                {t("comments.page.hotComments")}
              </h3>
              <div className="space-y-6">
                {hotComments.map((comment) => (
                  <CommentItem
                    key={`hot-${comment.commentId}`}
                    comment={comment}
                    isHot
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    onReport={(id) => console.log("report", id)}
                    onRouterClick={(url) => smartRouter.push(url)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">
              {t("comments.page.latestComments")}
            </h3>
            {comments.length === 0 && !isLoading ? (
              <div className="text-center text-zinc-500 py-20">{t("comments.page.noComments")}</div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <CommentItem
                    key={`latest-${comment.commentId}`}
                    comment={comment}
                    currentUserId={currentUserId}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    onReport={(id) => console.log("report", id)}
                    onRouterClick={(url) => smartRouter.push(url)}
                  />
                ))}
              </div>
            )}
          </section>

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

      {isLogin && (
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => setIsInputOpen((open) => !open)}
          className="fixed bottom-28 right-8 z-40 flex items-center justify-center w-14 h-14
          bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full shadow-lg hover:shadow-2xl
          hover:scale-105 active:scale-95 transition-all duration-200 group"
          title={replyTarget ? t("comments.page.replyComment") : t("comments.page.addComment")}
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      <div
        className={`fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ease-out
        ${isInputOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div
          ref={inputPanelRef}
          className="w-full max-w-4xl bg-[#1a1a1a]/95 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative pointer-events-auto"
        >
          <div className="px-6 pt-8 md:pt-9">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-lg font-bold shrink-0">
                  {replyTarget ? t("comments.page.replyComment") : t("comments.page.addComment")}
                </h3>
                {replyTarget && (
                  <span className="text-sm text-[#1DB954] truncate">
                    @{replyTarget.user?.nickname}
                  </span>
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

            {replyTarget && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg flex items-start gap-3">
                <div className="flex-1 text-sm min-w-0">
                  <span className="text-[#B3B3B3]">{t("comments.page.replyingTo")}</span>
                  <span className="text-white line-clamp-2">{replyTarget.content}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-[#B3B3B3] hover:text-white shrink-0"
                  title={t("comments.input.cancel")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <CommentInputBox
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onSubmit={handleSubmitComment}
            />
          </div>

          <div className="flex justify-center pb-3 pt-1">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
