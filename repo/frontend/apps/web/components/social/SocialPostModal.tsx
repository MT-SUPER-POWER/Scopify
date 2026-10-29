"use client";

import { ChevronLeft, ChevronRight, Heart, MessageCircle, Repeat2, Share2, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { useSocialCommentActions, useSocialCommentWriter } from "@/hooks/social/useSocialComments";
import { useSocialPostModal } from "@/hooks/social/useSocialPostModal";
import {
  useSocialAccount,
  useSocialComments,
  useSocialEvent,
} from "@/hooks/social/useSocialQueries";
import { useSocialShare } from "@/hooks/social/useSocialShare";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { uniqueById } from "@/lib/social/normalize";
import { formatSocialTime } from "@/lib/social/time";
import { useI18n } from "@/store/module/i18n";
import type {
  SocialCommentRowProps,
  SocialEventProps,
  SocialPostViewProps,
} from "@/types/social/components";
import type { SocialComment } from "@/types/social/model";
import { SocialComposer } from "./SocialComposer";
import { SocialEventCard } from "./SocialEventCard";
import { SocialEventMenu } from "./SocialEventMenu";
import { SocialInlineText } from "./SocialInlineText";
import { SocialPostText } from "./SocialPostText";
import {
  FollowButton,
  SocialAuthor,
  SocialAvatar,
  SocialLoadMore,
  SocialState,
} from "./SocialPrimitives";
import { SocialResourceCard } from "./SocialResourceCard";
import { SocialCommentsSkeleton } from "./SocialCommentsSkeleton";
import s from "./Social.module.css";

/**
 * 动态浮层（参考小红书）：左侧大图；右侧作者与关注、正文、评论，底部评论框与互动计数。
 * 打开状态写在 URL 上，由 useSocialPostModal 管理。
 */
export function SocialPostModal() {
  const { t } = useI18n();
  const { target, close } = useSocialPostModal();
  const query = useSocialEvent(target ?? { id: "", uid: "" });
  const event = target ? query.data : undefined;
  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={s.postModal}
        data-media={event ? hasMedia(event) : true}
      >
        <DialogTitle className="sr-only">{t("social.detail")}</DialogTitle>
        <DialogDescription className="sr-only">
          {event?.title || event?.text || t("social.detail")}
        </DialogDescription>
        <DialogClose className={s.postModalClose} aria-label={t("social.close")}>
          <X />
        </DialogClose>
        <div className={s.postModalFrame}>
          {event ? (
            <SocialPostView key={event.id} event={event} onDeleted={close} />
          ) : (
            <div className={s.postModalState}>
              <SocialState
                loading={query.isPending}
                error={query.isError}
                empty={t("social.unavailable")}
                onRetry={() => void query.refetch()}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 纯转发没有自己的配图和资源时，展示原动态的内容 */
function mediaSource(event: SocialEventProps["event"]) {
  return event.pictures.length || event.resource || !event.forward ? event : event.forward;
}
function hasMedia(event: SocialEventProps["event"]) {
  const content = mediaSource(event);
  return content.pictures.length > 0 || !!content.resource?.cover;
}

function SocialPostView({ event, onDeleted }: SocialPostViewProps) {
  const { t, locale } = useI18n();
  const { uid } = useSocialAccount();
  const requireLogin = useRequireLoginAction();
  const actions = useSocialEventActions(event);
  const copyLink = useSocialShare(event);
  const comments = useSocialComments(event.threadId);
  const write = useSocialCommentWriter(event);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<SocialComment>();
  const [forwarding, setForwarding] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const content = mediaSource(event);
  const items = uniqueById(comments.data?.pages.flatMap((page) => page.items) ?? []);
  const canComment = !!uid && !!event.threadId;

  async function submit() {
    if (!text.trim() || write.isPending) return;
    try {
      await write.mutateAsync({ text: text.trim(), reply: reply?.id });
      setText("");
      setReply(undefined);
    } catch {
      /* 保留输入与回复对象，便于重试 */
    }
  }

  return (
    <>
      {hasMedia(event) && <SocialPostMedia event={content} />}
      <section className={s.postPanel}>
        <header className={s.postPanelHeader}>
          <SocialAvatar user={event.user} />
          <SocialAuthor user={event.user} />
          <FollowButton user={event.user} className={s.postFollow} />
        </header>

        <div className={s.postPanelScroll}>
          <article className={s.postCaption}>
            {event.title && (
              <h2 className={s.postCaptionTitle}>
                <SocialInlineText text={event.title} />
              </h2>
            )}
            {event.text && <SocialPostText text={event.text} expanded />}
            {event.forward && !event.unavailableForward && content === event && (
              <div className={s.quote}>
                <SocialEventCard event={event.forward} quoted />
              </div>
            )}
            {content.resource && <SocialResourceCard resource={content.resource} />}
            <div className={s.postMeta}>
              {event.time > 0 && (
                <time dateTime={new Date(event.time).toISOString()}>
                  {formatSocialTime(event.time, locale)}
                </time>
              )}
              <SocialEventMenu
                event={event}
                pending={actions.remove.isPending}
                onDelete={(onSuccess) =>
                  actions.remove.mutate(undefined, {
                    onSuccess: () => {
                      onSuccess();
                      onDeleted();
                    },
                  })
                }
              />
            </div>
          </article>

          {!uid ? null : !event.threadId ? (
            <p className={s.postPanelNote}>{t("social.commentUnavailable")}</p>
          ) : (
            <section className={s.postComments}>
              <h3 className={s.postCommentsTotal}>
                {t("social.commentsTotal", {
                  count: comments.data?.pages[0]?.total ?? event.comments,
                })}
              </h3>
              <SocialState
                loading={comments.isPending}
                skeleton={<SocialCommentsSkeleton variant="modal" />}
                error={comments.isError && !items.length}
                empty={!items.length ? t("social.emptyComments") : undefined}
                onRetry={() => void comments.refetch()}
              >
                {items.map((comment) => (
                  <SocialPostComment
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
                  more={comments.hasNextPage}
                  pending={comments.isFetching}
                  error={comments.isError}
                  onLoad={() =>
                    void (comments.isRefetchError ? comments.refetch() : comments.fetchNextPage())
                  }
                />
              </SocialState>
            </section>
          )}
        </div>

        <footer className={s.postPanelFooter}>
          {reply && (
            <button
              type="button"
              className={s.postReplyTag}
              aria-label={t("social.cancel")}
              onClick={() => setReply(undefined)}
            >
              {t("social.replyTo", { name: reply.user.name })}
              <X aria-hidden="true" />
            </button>
          )}
          <div className={s.postBar}>
            {canComment && (
              <form
                className={s.postCommentForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  ref={input}
                  value={text}
                  maxLength={140}
                  disabled={write.isPending}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("social.commentPlaceholder")}
                  aria-label={t("social.commentPlaceholder")}
                />
                {text.trim() && (
                  <button type="submit" disabled={write.isPending}>
                    {t(write.isPending ? "social.sending" : "social.send")}
                  </button>
                )}
              </form>
            )}
            {!text.trim() && (
              <div className={s.postActions}>
                <button
                  type="button"
                  data-active={event.liked}
                  aria-pressed={event.liked}
                  disabled={actions.liking || !event.threadId}
                  aria-label={t(event.liked ? "social.unlike" : "social.like")}
                  onClick={() => void requireLogin(() => actions.like.mutate(!event.liked))}
                >
                  <Heart />
                  {formatCount(event.likes, locale)}
                </button>
                <button
                  type="button"
                  aria-label={t("social.comments")}
                  disabled={!canComment}
                  onClick={() => input.current?.focus()}
                >
                  <MessageCircle />
                  {formatCount(event.comments, locale)}
                </button>
                <button
                  type="button"
                  aria-label={t("social.forward")}
                  disabled={!event.user.id}
                  onClick={() => void requireLogin(() => setForwarding(true))}
                >
                  <Repeat2 />
                  {formatCount(event.forwards, locale)}
                </button>
                <button
                  type="button"
                  aria-label={t("social.share")}
                  onClick={() => void copyLink()}
                >
                  <Share2 />
                </button>
              </div>
            )}
          </div>
        </footer>
      </section>

      <Dialog open={forwarding} onOpenChange={setForwarding}>
        <DialogContent className={s.dialog + " sm:max-w-2xl"}>
          <DialogTitle>{t("social.forward")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("social.forwardPlaceholder")}
          </DialogDescription>
          <SocialComposer forwarded={event} onDone={() => setForwarding(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 左侧媒体区：多图可左右切换；只有歌曲时以封面加模糊底展示 */
function SocialPostMedia({ event }: SocialEventProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const count = event.pictures.length;
  if (!count && event.resource?.cover) {
    return (
      <div className={s.postMedia} data-kind="cover">
        <img
          className={s.postMediaBackdrop}
          src={event.resource.cover}
          alt=""
          referrerPolicy="no-referrer"
        />
        <img
          className={s.postMediaCover}
          src={event.resource.cover}
          alt=""
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return (
    <div className={s.postMedia}>
      <img
        src={event.pictures[index]}
        alt={t("social.picture", { index: index + 1 })}
        referrerPolicy="no-referrer"
      />
      {count > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              className={s.postMediaNav}
              data-side="prev"
              aria-label={t("social.previousImage")}
              onClick={() => setIndex(index - 1)}
            >
              <ChevronLeft />
            </button>
          )}
          {index < count - 1 && (
            <button
              type="button"
              className={s.postMediaNav}
              data-side="next"
              aria-label={t("social.nextImage")}
              onClick={() => setIndex(index + 1)}
            >
              <ChevronRight />
            </button>
          )}
          <div className={s.postMediaDots} aria-live="polite">
            {event.pictures.map((url, dot) => (
              <span key={url + dot} data-active={dot === index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** 小红书式评论行：名字在上、正文在下，底部是时间与赞 / 回复 */
function SocialPostComment({ event, comment, onReply }: SocialCommentRowProps) {
  const { t, locale } = useI18n();
  const { uid } = useSocialAccount();
  const requireLogin = useRequireLoginAction();
  const actions = useSocialCommentActions(event, comment);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={s.postComment}>
      <SocialAvatar user={comment.user} />
      <div className="min-w-0 flex-1">
        <SocialAuthor user={comment.user} />
        <p className={s.postCommentText}>{comment.text}</p>
        {comment.reply && (
          <p className={s.postCommentQuote}>
            {t("social.replyTo", { name: comment.reply.user.name })}：{comment.reply.text}
          </p>
        )}
        {comment.time > 0 && (
          <time className={s.postCommentTime}>{formatSocialTime(comment.time, locale)}</time>
        )}
        <div className={s.postCommentMeta}>
          <button
            type="button"
            data-active={comment.liked}
            aria-pressed={comment.liked}
            aria-label={t(comment.liked ? "social.unlike" : "social.like")}
            disabled={actions.liking}
            onClick={() => void requireLogin(() => actions.like.mutate(!comment.liked))}
          >
            <Heart />
            {formatCount(comment.likes, locale) || t("social.like")}
          </button>
          <button type="button" onClick={() => void requireLogin(() => onReply(comment))}>
            <MessageCircle />
            {t("social.reply")}
          </button>
          {comment.user.id === uid && (
            <button
              type="button"
              data-danger={confirming}
              disabled={actions.remove.isPending}
              onClick={() => (confirming ? actions.remove.mutate(undefined) : setConfirming(true))}
              onBlur={() => setConfirming(false)}
            >
              {t(confirming ? "social.confirmDelete" : "social.delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCount(count: number, locale: string) {
  return count > 0 ? new Intl.NumberFormat(locale, { notation: "compact" }).format(count) : "";
}
