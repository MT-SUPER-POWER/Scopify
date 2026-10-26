"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { getCommentHref } from "@/lib/comment/commentResource";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { MvCommentsProps } from "@/types/components/mv";

type MvCommentTab = "hot" | "latest";

/**
 * MV 页视频下方的评论区（参考 YouTube）：评论数与精彩/最新切换、常驻输入框、
 * 复用评论页的评论条目，最新评论滚动到底自动加载。
 */
export function MvComments({ mvid }: MvCommentsProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const isLogin = useLoginStatus();
  const currentUser = useUserStore((state) => state.user);
  const resource = useMemo(() => ({ kind: "mv" as const, id: String(mvid) }), [mvid]);
  const {
    comments,
    handleDelete,
    handleLike,
    handleReply,
    handleSubmitComment,
    hasMore,
    hotComments,
    isLoading,
    loadMore,
    replyTarget,
    setReplyTarget,
    total,
  } = useCommentData(resource);
  const [tab, setTab] = useState<MvCommentTab>("hot");
  const activeTab: MvCommentTab = hotComments.length > 0 ? tab : "latest";
  const composerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const list = activeTab === "hot" ? hotComments : comments;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || activeTab !== "latest") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) void loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, hasMore, isLoading, loadMore]);

  const reply = (commentId: number) => {
    handleReply(commentId);
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="text-xl font-bold text-content">
          {t("mv.comments.count", { count: total.toLocaleString() })}
        </h2>
        <div role="tablist" className="flex gap-2">
          {hotComments.length > 0 &&
            (["hot", "latest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={activeTab === value}
                onClick={() => setTab(value)}
                className={cn(
                  "rounded-lg px-3 py-1 text-sm font-semibold transition-colors",
                  activeTab === value
                    ? "bg-content text-surface"
                    : "bg-content/8 text-content hover:bg-content/15",
                )}
              >
                {t(value === "hot" ? "comments.page.hotComments" : "comments.page.latestComments")}
              </button>
            ))}
        </div>
        <Link
          href={getCommentHref("mv", mvid)}
          scroll={false}
          className="ml-auto text-sm font-semibold text-content-muted transition-colors hover:text-content"
        >
          {t("mv.comments.openPage")}
        </Link>
      </div>

      <div ref={composerRef} className="mt-5 flex gap-4">
        <span className="relative mt-1 size-10 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
          {currentUser?.avatarUrl && (
            <Image
              fill
              sizes="40px"
              src={getSizedImageUrl(currentUser.avatarUrl, 120)}
              alt=""
              className="object-cover"
            />
          )}
        </span>
        {isLogin ? (
          <div className="min-w-0 flex-1">
            <CommentInputBox
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onSubmit={async (text) => {
                const ok = await handleSubmitComment(text);
                if (ok) setTab("latest");
                return ok;
              }}
            />
          </div>
        ) : (
          <p className="flex-1 self-center border-b border-content/10 pb-2 text-sm text-content-subtle">
            {t("mv.comments.loginToComment")}
          </p>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {list.map((comment) => (
          <CommentItem
            key={`${activeTab}-${comment.commentId}`}
            comment={comment}
            isHot={activeTab === "hot"}
            currentUserId={currentUser?.userId}
            onLike={handleLike}
            onDelete={handleDelete}
            onReply={reply}
            onRouterClick={(url) => smartRouter.push(url)}
          />
        ))}
        {list.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sm text-content-subtle">
            {t("comments.page.noComments")}
          </p>
        )}
      </div>

      {activeTab === "latest" && (
        <div ref={loadMoreRef} className="flex justify-center py-6 text-sm text-content-muted">
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-brand" />
          ) : hasMore ? (
            t("comments.page.loadMore")
          ) : comments.length > 0 ? (
            t("comments.page.end")
          ) : null}
        </div>
      )}
    </section>
  );
}
