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
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { uniqueById } from "@/lib/social/normalize";
import { formatSocialTime } from "@/lib/social/time";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type {
  SocialCommentRowProps,
  SocialEventProps,
  SocialPostViewProps,
} from "@/types/social/components";
import type { SocialComment } from "@/types/social/model";
import { SocialComposer } from "@/components/social/SocialComposer";
import { SocialEventCard } from "@/components/social/SocialEventCard";
import { SocialEventMenu } from "@/components/social/SocialEventMenu";
import { SocialInlineText } from "@/components/social/SocialInlineText";
import { SocialPostText } from "@/components/social/SocialPostText";
import {
  FollowButton,
  SocialAuthor,
  SocialAvatar,
  SocialLoadMore,
  SocialState,
} from "@/components/social/SocialPrimitives";
import { SocialResourceCard } from "@/components/social/SocialResourceCard";
import { SocialCommentsSkeleton } from "@/components/social/SocialCommentsSkeleton";
import { cn } from "@/lib/utils";
import {
  postCommentAuthorClass,
  postCommentClass,
  postCommentMetaClass,
  postCommentTextClass,
  postCommentTimeClass,
  socialDialogClass,
  socialQuoteClass,
} from "@/components/social/socialClasses";

/**
 * 浮层本身透明无边框，宽度随是否有媒体切换；900px 以下改为上下布局。
 * 浮层内分隔线比页面稍淡（foreground/9）。
 */
const postModalClass =
  "group/post-modal block h-[min(860px,calc(100dvh-48px))] w-[min(1200px,calc(100vw-128px))] max-w-none border-0 bg-transparent p-0 text-foreground shadow-none data-[media=false]:w-[min(560px,calc(100vw-128px))] sm:max-w-none max-[900px]:w-[calc(100vw-32px)] max-[900px]:data-[media=false]:w-[calc(100vw-32px)] [&_a]:no-underline [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_:is(button,a,input):focus-visible]:outline-2 [&_:is(button,a,input):focus-visible]:outline-offset-2 [&_:is(button,a,input):focus-visible]:outline-primary";
/** 正文区：正文不留上下外边距，附带的资源卡片与引用框统一上间距。 */
const postCaptionClass =
  "border-b border-foreground/9 pb-5 [&_[data-slot=social-post-text]]:m-0 [&_[data-slot=social-post-text]]:text-[15px] [&_[data-slot=social-post-text]]:leading-[1.75] [&_[data-slot=social-resource]]:mt-3.5 [&_[data-slot=social-resource]]:mb-0";
const postMediaClass =
  "relative flex min-w-0 flex-[1_1_auto] items-center justify-center overflow-hidden bg-black max-[900px]:flex-[0_0_42%]";
const postMediaNavClass =
  "absolute top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#111] [&_svg]:size-5";
const postActionButtonClass =
  "inline-flex items-center gap-[5px] text-[14px] text-foreground transition-opacity duration-150 ease-[ease] hover:opacity-65 data-[active=true]:text-primary [&_svg]:size-[22px] data-[active=true]:[&_svg]:fill-current";
const postCommentMetaButtonClass =
  "inline-flex items-center gap-1 hover:text-foreground data-[active=true]:text-primary data-[danger=true]:text-destructive [&_svg]:size-[15px] data-[active=true]:[&_svg]:fill-current";

/**
 * 动态浮层（参考小红书）：左侧大图；右侧作者与关注、正文、评论，底部评论框与互动计数。
 * 打开状态写在 URL 上，由 useSocialPostModal 管理。
 */
export function SocialPostModal() {
  const { t } = useTranslation();
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
        className={postModalClass}
        data-media={event ? hasMedia(event) : true}
      >
        <DialogTitle className="sr-only">{t("social.detail")}</DialogTitle>
        <DialogDescription className="sr-only">
          {event?.title || event?.text || t("social.detail")}
        </DialogDescription>
        <DialogClose
          className="absolute top-0 -left-14 inline-flex size-10 items-center justify-center rounded-full bg-card/80 text-foreground transition-[background-color] duration-200 ease-[ease] hover:bg-card max-[900px]:top-2.5 max-[900px]:left-2.5 max-[900px]:z-1 [&_svg]:size-5"
          aria-label={t("social.close")}
        >
          <X />
        </DialogClose>
        <div className="flex size-full overflow-hidden rounded-[20px] bg-card max-[900px]:flex-col">
          {event ? (
            <SocialPostView key={event.id} event={event} onDeleted={close} />
          ) : (
            <div className="grid flex-1 place-items-center">
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
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
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
      <section className="flex min-h-0 w-110 flex-none flex-col group-data-[media=false]/post-modal:w-full max-[900px]:w-full max-[900px]:flex-1">
        <header className="flex items-center gap-3 px-6 pt-[22px] pb-3.5 text-[15px]">
          <SocialAvatar user={event.user} className="size-10 max-[768px]:size-10" />
          <SocialAuthor user={event.user} className="min-w-0 flex-1 truncate font-medium" />
          <FollowButton
            user={event.user}
            className="min-h-[38px] min-w-22 rounded-full border border-primary bg-transparent px-5 py-0 text-[15px] font-semibold text-primary hover:bg-primary/12 aria-pressed:border-foreground/9 aria-pressed:text-muted-foreground"
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-1 pb-4">
          <article className={postCaptionClass}>
            {event.title && (
              <h2 className="mt-1 mb-2 text-[18px] leading-normal font-bold wrap-anywhere">
                <SocialInlineText text={event.title} />
              </h2>
            )}
            {event.text && <SocialPostText text={event.text} expanded />}
            {event.forward && !event.unavailableForward && content === event && (
              <div className={cn(socialQuoteClass, "mt-3.5 border-foreground/9")}>
                <SocialEventCard event={event.forward} quoted />
              </div>
            )}
            {content.resource && <SocialResourceCard resource={content.resource} />}
            <div className="mt-3 flex items-center justify-between text-[13px] text-muted-foreground">
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
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              {t("social.commentUnavailable")}
            </p>
          ) : (
            <section className="pt-[18px]">
              <h3 className="mb-[18px] text-[14px] font-normal text-muted-foreground">
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

        <footer className="border-t border-foreground/9 px-5 pt-3 pb-4">
          {reply && (
            <button
              type="button"
              className="mb-2 ml-1 inline-flex items-center gap-1 rounded-full bg-foreground/8 px-2.5 py-0.5 text-[12px] text-muted-foreground [&_svg]:size-3"
              aria-label={t("social.cancel")}
              onClick={() => setReply(undefined)}
            >
              {t("social.replyTo", { name: reply.user.name })}
              <X aria-hidden="true" />
            </button>
          )}
          <div className="flex items-center gap-3.5">
            {canComment && (
              <form
                className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-foreground/7 pr-1.5 pl-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <input
                  ref={input}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-foreground outline-none"
                  value={text}
                  maxLength={140}
                  disabled={write.isPending}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("social.commentPlaceholder")}
                  aria-label={t("social.commentPlaceholder")}
                />
                {text.trim() && (
                  <button
                    type="submit"
                    className="h-[30px] rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground"
                    disabled={write.isPending}
                  >
                    {t(write.isPending ? "social.sending" : "social.send")}
                  </button>
                )}
              </form>
            )}
            {!text.trim() && (
              <div className="ml-auto flex shrink-0 items-center gap-3.5">
                <button
                  type="button"
                  className={postActionButtonClass}
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
                  className={postActionButtonClass}
                  aria-label={t("social.comments")}
                  disabled={!canComment}
                  onClick={() => input.current?.focus()}
                >
                  <MessageCircle />
                  {formatCount(event.comments, locale)}
                </button>
                <button
                  type="button"
                  className={postActionButtonClass}
                  aria-label={t("social.forward")}
                  disabled={!event.user.id}
                  onClick={() => void requireLogin(() => setForwarding(true))}
                >
                  <Repeat2 />
                  {formatCount(event.forwards, locale)}
                </button>
                <button
                  type="button"
                  className={postActionButtonClass}
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
        <DialogContent className={cn(socialDialogClass, "sm:max-w-2xl")}>
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
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const count = event.pictures.length;
  if (!count && event.resource?.cover) {
    return (
      <div className={postMediaClass} data-kind="cover">
        <img
          className="absolute -inset-10 size-[calc(100%+80px)] object-cover blur-2xl brightness-50"
          src={event.resource.cover}
          alt=""
          referrerPolicy="no-referrer"
        />
        <img
          className="relative aspect-square h-auto w-[min(68%,440px)] rounded-[12px] object-cover shadow-[0_24px_60px_rgb(0_0_0/0.5)]"
          src={event.resource.cover}
          alt=""
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return (
    <div className={postMediaClass}>
      <img
        className="size-full object-contain"
        src={event.pictures[index]}
        alt={t("social.picture", { index: index + 1 })}
        referrerPolicy="no-referrer"
      />
      {count > 1 && (
        <>
          {index > 0 && (
            <button
              type="button"
              className={cn(postMediaNavClass, "left-3.5")}
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
              className={cn(postMediaNavClass, "right-3.5")}
              data-side="next"
              aria-label={t("social.nextImage")}
              onClick={() => setIndex(index + 1)}
            >
              <ChevronRight />
            </button>
          )}
          <div
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-[5px]"
            aria-live="polite"
          >
            {event.pictures.map((url, dot) => (
              <span
                key={url + dot}
                data-active={dot === index}
                className="size-1.5 rounded-full bg-white/40 data-[active=true]:bg-white"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** 小红书式评论行：名字在上、正文在下，底部是时间与赞 / 回复 */
function SocialPostComment({ event, comment, onReply }: SocialCommentRowProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const { uid } = useSocialAccount();
  const requireLogin = useRequireLoginAction();
  const actions = useSocialCommentActions(event, comment);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={postCommentClass}>
      <SocialAvatar user={comment.user} className="size-9 max-[768px]:size-9" />
      <div className="min-w-0 flex-1">
        <SocialAuthor user={comment.user} className={postCommentAuthorClass} />
        <p className={postCommentTextClass}>{comment.text}</p>
        {comment.reply && (
          <p className="leading-1.6 mt-1.5 border-l-2 border-foreground/9 pl-2.5 text-[13px] wrap-anywhere text-muted-foreground">
            {t("social.replyTo", { name: comment.reply.user.name })}：{comment.reply.text}
          </p>
        )}
        {comment.time > 0 && (
          <time className={postCommentTimeClass}>{formatSocialTime(comment.time, locale)}</time>
        )}
        <div className={postCommentMetaClass}>
          <button
            type="button"
            className={postCommentMetaButtonClass}
            data-active={comment.liked}
            aria-pressed={comment.liked}
            aria-label={t(comment.liked ? "social.unlike" : "social.like")}
            disabled={actions.liking}
            onClick={() => void requireLogin(() => actions.like.mutate(!comment.liked))}
          >
            <Heart />
            {formatCount(comment.likes, locale) || t("social.like")}
          </button>
          <button
            type="button"
            className={postCommentMetaButtonClass}
            onClick={() => void requireLogin(() => onReply(comment))}
          >
            <MessageCircle />
            {t("social.reply")}
          </button>
          {comment.user.id === uid && (
            <button
              type="button"
              className={postCommentMetaButtonClass}
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
