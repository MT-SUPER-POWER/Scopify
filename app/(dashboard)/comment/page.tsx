"use client";

import { Loader2, MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { CommentInputBox } from "@/components/Comment/CommentInputBox";
import { CommentItem } from "@/components/Comment/CommentItem";
import { useCommentData } from "@/hooks/comment/useCommentData";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";

export default function CommentPage() {
  const { t } = useI18n();
  const isLogin = useLoginStatus();
  const smartRouter = useSmartRouter();
  const observerTarget = useRef<HTMLDivElement>(null);
  const inputPanelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const {
    songId, songInfo, albumCover, replyTarget, setReplyTarget,
    hotComments, comments, total, hasMore, isLoading, isInputOpen, setIsInputOpen,
    loadMore, handleLike, handleDelete,
  } = useCommentData();

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !isLoading) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Close input panel on outside click
  useEffect(() => {
    if (!isInputOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (inputPanelRef.current?.contains(e.target as Node) || toggleBtnRef.current?.contains(e.target as Node)) return;
      setIsInputOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isInputOpen, setIsInputOpen]);

  if (!songId) return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#121212] text-zinc-400 gap-4 p-8">
      <MessageCircle className="w-16 h-16 opacity-30" />
      <span>{t("comments.page.noComments")}</span>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-[#121212] font-sans text-white pb-24">
      <div className="sticky top-0 z-20 bg-[#121212]/80 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <button type="button" onClick={() => smartRouter.back()} className="text-zinc-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
        {albumCover && (
          <Image width={40} height={40} src={albumCover} alt="" className="w-10 h-10 rounded object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{songInfo?.name || t("common.meta.unknownSong")}</h1>
          <button type="button" onClick={() => smartRouter.push(`/artist?id=${songInfo?.ar?.[0]?.id}`)}
            className="text-xs text-zinc-400 hover:text-white hover:underline truncate block">
            {songInfo?.ar?.[0]?.name || ""}
          </button>
        </div>
        <span className="text-xs text-zinc-500 shrink-0">{total > 0 ? t("comments.page.allComments") : ""}</span>
      </div>

      <div className="px-4 py-4 space-y-6">
        {hotComments.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{t("comments.page.hotComments")}</h2>
            <div className="space-y-4">
              {hotComments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment} isHot
                  onLike={(id) => handleLike(id, !!comment.liked, true)}
                  onDelete={(id) => handleDelete(id)}
                  onReply={() => setReplyTarget(comment)} onReport={(id) => console.log("report", id)}
                  onRouterClick={(url) => smartRouter.push(url)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{t("comments.page.allComments")}</h2>
          {comments.length === 0 && !isLoading ? (
            <div className="text-center text-zinc-500 py-16">{t("comments.page.noComments")}</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment}
                  onLike={(id) => handleLike(id, !!comment.liked, false)}
                  onDelete={(id) => handleDelete(id)}
                  onReply={() => setReplyTarget(comment)} onReport={(id) => console.log("report", id)}
                  onRouterClick={(url) => smartRouter.push(url)} />
              ))}
            </div>
          )}
          {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>}
          <div ref={observerTarget} className="h-4" />
        </section>
      </div>

      {isLogin && !isInputOpen && (
        <button ref={toggleBtnRef} type="button" onClick={() => setIsInputOpen(true)}
          className="fixed bottom-6 right-6 bg-[#1ed760] hover:bg-[#3be477] text-black rounded-full w-14 h-14 flex items-center justify-center shadow-xl z-30 transition-all hover:scale-105">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isLogin && isInputOpen && (
        <div ref={inputPanelRef} className="fixed bottom-0 left-0 right-0 z-40 bg-[#282828] border-t border-white/10 p-4 shadow-2xl">
          <CommentInputBox replyTarget={replyTarget}
            onCancelReply={() => setReplyTarget(null)}
            onSubmit={async (_text) => { setIsInputOpen(false); setReplyTarget(null); return true; }} />
        </div>
      )}
    </div>
  );
}
