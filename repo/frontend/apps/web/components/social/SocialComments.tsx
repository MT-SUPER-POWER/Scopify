"use client";

import { Heart, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useSocialAccount, useSocialComments } from "@/hooks/social/useSocialQueries";
import { useSocialCommentActions, useSocialCommentWriter } from "@/hooks/social/useSocialComments";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventProps, SocialCommentRowProps } from "@/types/components/social";
import type { SocialComment } from "@/types/social";
import {
  SocialAuthor,
  SocialAvatar,
  SocialLoadMore,
  SocialLogin,
  SocialState,
} from "./SocialPrimitives";
import s from "./Social.module.css";

function CommentRow({ event, comment, onReply }: SocialCommentRowProps) {
  const { uid } = useSocialAccount(),
    { t, locale } = useI18n(),
    requireLogin = useRequireLoginAction();
  const actions = useSocialCommentActions(event, comment),
    [deleting, setDeleting] = useState(false);
  return (
    <div className={s.comment}>
      <SocialAvatar user={comment.user} size="small" />
      <div className={s.eventBody}>
        <div className={s.eventHeader}>
          <SocialAuthor user={comment.user} />
          {comment.time > 0 && (
            <time dateTime={new Date(comment.time).toISOString()}>
              {new Date(comment.time).toLocaleString(locale, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
        </div>
        <p className={s.postText}>{comment.text}</p>
        {comment.reply && (
          <blockquote className={s.reply}>
            <SocialAuthor user={comment.reply.user} />：{comment.reply.text}
          </blockquote>
        )}
        <div className={s.actions}>
          <button
            type="button"
            className={s.action}
            onClick={() => void requireLogin(() => onReply(comment))}
          >
            {t("social.reply")}
          </button>
          <button
            type="button"
            className={s.action}
            data-active={comment.liked}
            aria-pressed={comment.liked}
            aria-label={t(comment.liked ? "social.unlike" : "social.like")}
            disabled={actions.liking}
            onClick={() => void requireLogin(() => actions.like.mutate(!comment.liked))}
          >
            <Heart />
            {comment.likes || ""}
          </button>
          {comment.user.id === uid && (
            <button
              type="button"
              className={s.iconButton}
              aria-label={t("social.delete")}
              onClick={() => setDeleting(true)}
            >
              <Trash2 />
            </button>
          )}
        </div>
      </div>
      <Dialog
        open={deleting}
        onOpenChange={(value) => {
          if (!actions.remove.isPending) setDeleting(value);
        }}
      >
        <DialogContent className={s.dialog}>
          <DialogTitle>{t("social.deleteComment")}</DialogTitle>
          <DialogDescription>{t("social.deleteCommentHint")}</DialogDescription>
          <div className={s.row + " justify-end"}>
            <button
              type="button"
              className={s.button}
              disabled={actions.remove.isPending}
              onClick={() => setDeleting(false)}
            >
              {t("social.cancel")}
            </button>
            <button
              type="button"
              className={s.button + " " + s.danger}
              disabled={actions.remove.isPending}
              onClick={() =>
                actions.remove.mutate(undefined, { onSuccess: () => setDeleting(false) })
              }
            >
              {t("social.delete")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function SocialComments({ event }: SocialEventProps) {
  const { t } = useI18n(),
    { uid } = useSocialAccount();
  const query = useSocialComments(event.threadId),
    write = useSocialCommentWriter(event);
  const [text, setText] = useState(""),
    [reply, setReply] = useState<SocialComment>(),
    input = useRef<HTMLTextAreaElement>(null);
  const comments = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  if (!uid) return <SocialLogin />;
  if (!event.threadId) return <SocialState empty={t("social.commentUnavailable")} />;
  async function submit() {
    if (!text.trim() || write.isPending) return;
    try {
      await write.mutateAsync({ text: text.trim(), reply: reply?.id });
      setText("");
      setReply(undefined);
    } catch {
      /* Preserve reply target and text. */
    }
  }
  return (
    <section id="social-comments" className="scroll-mt-24">
      <h2 className={s.sectionTitle + " mt-6"}>
        {t("social.comments")}{" "}
        <span className={s.muted}>{query.data?.pages[0]?.total ?? event.comments}</span>
      </h2>
      <form
        className={s.commentForm}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {reply && (
          <div className={s.between}>
            <span className={s.muted}>{t("social.replyTo", { name: reply.user.name })}</span>
            <button
              type="button"
              className={s.iconButton}
              aria-label={t("social.cancel")}
              disabled={write.isPending}
              onClick={() => setReply(undefined)}
            >
              <X />
            </button>
          </div>
        )}
        <textarea
          ref={input}
          rows={2}
          className={s.textarea}
          disabled={write.isPending}
          maxLength={140}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("social.commentPlaceholder")}
          aria-label={t("social.commentPlaceholder")}
        />
        <div className={s.row + " justify-end"}>
          <span className={s.counter}>{text.length}/140</span>
          <button
            type="submit"
            className={s.button + " " + s.primary}
            disabled={write.isPending || !text.trim()}
          >
            {t(write.isPending ? "social.sending" : "social.send")}
          </button>
        </div>
      </form>
      <SocialState
        loading={query.isPending}
        error={query.isError && !comments.length}
        empty={!comments.length ? t("social.emptyComments") : undefined}
        onRetry={() => void query.refetch()}
      >
        {comments.map((comment) => (
          <CommentRow
            key={comment.id}
            event={event}
            comment={comment}
            onReply={(value) => {
              setReply(value);
              input.current?.focus();
            }}
          />
        ))}
        <SocialLoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          error={query.isError}
          onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
        />
      </SocialState>
    </section>
  );
}
