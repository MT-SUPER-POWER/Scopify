"use client";

import { Loader2, MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CommentHeader } from "@/components/Comment/CommentHeader";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
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
    resourceId,
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

  if (!resourceId) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-surface-raised p-8 text-content-muted">
        <MessageCircle className="size-16 opacity-30" />
        <span>{t("comments.page.noComments")}</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-surface-raised pb-12 font-sans text-content">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-100 scale-110 bg-cover bg-center opacity-60 blur-3xl md:h-125"
        style={{
          backgroundImage: `linear-gradient(to bottom, var(--scopify-image-scrim), var(--card)), url(${albumCover})`,
        }}
      />

      <CommentHeader
        coverUrl={albumCover}
        title={commentHeaderInfo.title}
        albumName={commentHeaderInfo.albumName}
        artists={commentHeaderInfo.artists}
        total={commentHeaderInfo.total}
        tagLabel={commentHeaderInfo.tagLabel}
        onArtistClick={(artistId) => smartRouter.push(`/artist?id=${artistId}`)}
      />

      <div className="hero-content-transition relative z-10 flex flex-col px-6 pt-6 md:px-8 md:pt-8 lg:px-10 xl:px-12">
        <div className="w-full pb-10">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="flex items-baseline gap-2 text-xl font-bold">
              {t("comments.page.allComments")}
              {commentHeaderInfo.total > 0 && (
                <span className="text-sm font-normal text-content-muted">
                  ({commentHeaderInfo.total.toLocaleString()})
                </span>
              )}
            </h2>
          </div>

          {hotComments.length > 0 && (
            <section className="mb-10">
              <h3 className="mb-6 border-b border-border pb-2 text-lg font-bold">
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
            <h3 className="mb-6 border-b border-border pb-2 text-lg font-bold">
              {t("comments.page.latestComments")}
            </h3>
            {comments.length === 0 && !isLoading ? (
              <div className="py-20 text-center text-content-subtle">
                {t("comments.page.noComments")}
              </div>
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

          <div ref={observerTarget} className="flex items-center justify-center py-8">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-brand" />
            ) : hasMore ? (
              <span className="text-sm text-content-muted">{t("comments.page.loadMore")}</span>
            ) : (
              <span className="text-sm text-content-muted">{t("comments.page.end")}</span>
            )}
          </div>
        </div>
      </div>

      {isLogin && (
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => setIsInputOpen((open) => !open)}
          className="group fixed right-8 bottom-28 z-40 flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-brand transition-all duration-200 hover:scale-105 hover:bg-brand-hover active:scale-95"
          title={replyTarget ? t("comments.page.replyComment") : t("comments.page.addComment")}
        >
          <MessageCircle className="size-6 transition-transform group-hover:rotate-12" />
        </button>
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center transition-transform duration-300 ease-out ${isInputOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div
          ref={inputPanelRef}
          className="pointer-events-auto relative w-full max-w-4xl rounded-b-2xl border-x border-b border-border bg-surface-overlay/95 shadow-floating backdrop-blur-xl"
        >
          <div className="px-6 pt-8 md:pt-9">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="shrink-0 text-lg font-bold">
                  {replyTarget ? t("comments.page.replyComment") : t("comments.page.addComment")}
                </h3>
                {replyTarget && (
                  <span className="truncate text-sm text-brand">@{replyTarget.user?.nickname}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInputOpen(false);
                  setReplyTarget(null);
                }}
                className="rounded-full p-2 transition-colors hover:bg-content/10"
                title={t("common.action.close")}
              >
                <X className="size-5" />
              </button>
            </div>

            {replyTarget && (
              <div className="mb-4 flex items-start gap-3 rounded-lg bg-content/5 p-3">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="text-content-muted">{t("comments.page.replyingTo")}</span>
                  <span className="line-clamp-2 text-content">{replyTarget.content}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="shrink-0 text-content-muted hover:text-content"
                  title={t("comments.input.cancel")}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <CommentInputBox
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onSubmit={handleSubmitComment}
            />
          </div>

          <div className="flex justify-center pt-1 pb-3">
            <div className="h-1 w-12 rounded-full bg-content/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
