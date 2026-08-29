"use client";

import { ArrowUpDown, Check, Loader2, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommentHeader } from "@/components/Comment/CommentHeader";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

type CommentSortType = "default" | "latest" | "oldest" | "mostLiked";

export default function CommentPage() {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const currentUserId = useUserStore((state) => state.user?.userId ?? null);
  const smartRouter = useSmartRouter();
  const observerTarget = useRef<HTMLDivElement>(null);
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<"hot" | "latest">("hot");
  const [commentSort, setCommentSort] = useState<CommentSortType>("default");

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
    if (!isLoading && hotComments.length === 0) {
      setActiveTab("latest");
    }
  }, [hotComments.length, isLoading]);

  useEffect(() => {
    if (!observerTarget.current || activeTab !== "latest") return;

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
  }, [activeTab, hasMore, isLoading, loadMore]);

  const sortedHotComments = useMemo(() => {
    if (commentSort === "default" || commentSort === "mostLiked") {
      return [...hotComments].sort((a, b) => b.likedCount - a.likedCount);
    }
    if (commentSort === "latest") {
      return [...hotComments].sort((a, b) => {
        const timeA = a.time ?? (a.timeStr ? new Date(a.timeStr).getTime() : 0);
        const timeB = b.time ?? (b.timeStr ? new Date(b.timeStr).getTime() : 0);
        return timeB - timeA;
      });
    }
    if (commentSort === "oldest") {
      return [...hotComments].sort((a, b) => {
        const timeA = a.time ?? (a.timeStr ? new Date(a.timeStr).getTime() : 0);
        const timeB = b.time ?? (b.timeStr ? new Date(b.timeStr).getTime() : 0);
        return timeA - timeB;
      });
    }
    return hotComments;
  }, [hotComments, commentSort]);

  const sortedComments = useMemo(() => {
    if (commentSort === "default") return comments;
    if (commentSort === "mostLiked") {
      return [...comments].sort((a, b) => b.likedCount - a.likedCount);
    }
    if (commentSort === "latest") {
      return [...comments].sort((a, b) => {
        const timeA = a.time ?? (a.timeStr ? new Date(a.timeStr).getTime() : 0);
        const timeB = b.time ?? (b.timeStr ? new Date(b.timeStr).getTime() : 0);
        return timeB - timeA;
      });
    }
    if (commentSort === "oldest") {
      return [...comments].sort((a, b) => {
        const timeA = a.time ?? (a.timeStr ? new Date(a.timeStr).getTime() : 0);
        const timeB = b.time ?? (b.timeStr ? new Date(b.timeStr).getTime() : 0);
        return timeA - timeB;
      });
    }
    return comments;
  }, [comments, commentSort]);

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
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "hot" | "latest")}
            className="w-full"
          >
            <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
              <TabsList className="h-9 w-auto bg-surface-elevated/60 p-1">
                {hotComments.length > 0 && (
                  <TabsTrigger
                    value="hot"
                    className="px-4 text-xs font-semibold data-[state=active]:bg-surface-raised data-[state=active]:text-content"
                  >
                    {t("comments.page.hotComments")}
                    <span className="ml-1.5 text-xs text-content-muted">
                      ({hotComments.length})
                    </span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="latest"
                  className="px-4 text-xs font-semibold data-[state=active]:bg-surface-raised data-[state=active]:text-content"
                >
                  {t("comments.page.latestComments")}
                  {commentHeaderInfo.total > 0 && (
                    <span className="ml-1.5 text-xs text-content-muted">
                      ({commentHeaderInfo.total.toLocaleString()})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/40 bg-surface-elevated/60 px-3 py-1.5 text-xs font-medium text-content-muted transition-colors hover:bg-surface-elevated hover:text-content"
                  >
                    <ArrowUpDown className="size-3.5" />
                    <span>
                      {commentSort === "default"
                        ? t("comments.sort.default")
                        : commentSort === "latest"
                          ? t("comments.sort.latest")
                          : commentSort === "oldest"
                            ? t("comments.sort.oldest")
                            : t("comments.sort.mostLiked")}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => setCommentSort("default")}
                    className="flex cursor-pointer items-center justify-between text-xs"
                  >
                    {t("comments.sort.default")}
                    {commentSort === "default" && <Check className="size-3.5 text-brand" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCommentSort("latest")}
                    className="flex cursor-pointer items-center justify-between text-xs"
                  >
                    {t("comments.sort.latest")}
                    {commentSort === "latest" && <Check className="size-3.5 text-brand" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCommentSort("oldest")}
                    className="flex cursor-pointer items-center justify-between text-xs"
                  >
                    {t("comments.sort.oldest")}
                    {commentSort === "oldest" && <Check className="size-3.5 text-brand" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCommentSort("mostLiked")}
                    className="flex cursor-pointer items-center justify-between text-xs"
                  >
                    {t("comments.sort.mostLiked")}
                    {commentSort === "mostLiked" && <Check className="size-3.5 text-brand" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {hotComments.length > 0 && (
              <TabsContent value="hot" className="mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  {sortedHotComments.map((comment) => (
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
              </TabsContent>
            )}

            <TabsContent value="latest" className="mt-0 focus-visible:outline-none">
              {sortedComments.length === 0 && !isLoading ? (
                <div className="py-20 text-center text-content-subtle">
                  {t("comments.page.noComments")}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedComments.map((comment) => (
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

              <div ref={observerTarget} className="flex items-center justify-center py-8">
                {isLoading ? (
                  <Loader2 className="size-6 animate-spin text-brand" />
                ) : hasMore ? (
                  <span className="text-sm text-content-muted">{t("comments.page.loadMore")}</span>
                ) : (
                  <span className="text-sm text-content-muted">{t("comments.page.end")}</span>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
