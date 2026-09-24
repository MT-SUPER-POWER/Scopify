"use client";

import { Heart, MessageCircle, MoreHorizontal, Repeat2, Share, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { eventHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventProps } from "@/types/components/social";
import { SocialAvatar, SocialAuthor } from "./SocialPrimitives";
import { SocialComposer } from "./SocialComposer";
import { SocialResourceCard } from "./SocialResourceCard";
import s from "./Social.module.css";

export function SocialEventCard({ event, quoted = false, detail = false }: SocialEventProps) {
  const { t, locale } = useI18n(),
    { uid } = useSocialAccount(),
    requireLogin = useRequireLoginAction();
  const actions = useSocialEventActions(event);
  const [forward, setForward] = useState(false),
    [deleting, setDeleting] = useState(false),
    [picture, setPicture] = useState<string>();
  const href = eventHref(event);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        "https://music.163.com/#/event?id=" +
          encodeURIComponent(event.id) +
          "&uid=" +
          encodeURIComponent(event.user.id),
      );
      toast.success(t("social.copied"));
    } catch {
      toast.error(t("social.actionFailed"));
    }
  }
  return (
    <>
      <article className={s.event}>
        <SocialAvatar user={event.user} size={quoted ? "small" : undefined} />
        <div className={s.eventBody}>
          <div className={s.eventHeader}>
            <SocialAuthor user={event.user} />
            {event.time > 0 && (
              <Link href={href} scroll={false}>
                <time dateTime={new Date(event.time).toISOString()}>
                  {new Date(event.time).toLocaleString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </Link>
            )}
            {event.privacy !== undefined && event.privacy !== 0 && (
              <span className={s.privateNote}>
                {t(event.privacy === 2 ? "social.selfOnly" : "social.restricted")}
              </span>
            )}
            {!quoted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={s.iconButton + " " + s.eventMenu}
                    aria-label={t("social.more")}
                  >
                    <MoreHorizontal />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => void copyLink()}>
                    <Share className="size-4" />
                    {t("social.share")}
                  </DropdownMenuItem>
                  {event.user.id === uid && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => setDeleting(true)}
                    >
                      <Trash2 className="size-4" />
                      {t("social.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {event.text ? (
            <p className={s.postText}>{event.text}</p>
          ) : (
            !event.resource &&
            !event.forward &&
            !event.pictures.length && (
              <p className={s.postText + " " + s.muted}>{t("social.unknownPost")}</p>
            )
          )}
          {event.resource && <SocialResourceCard resource={event.resource} compact={quoted} />}
          {event.forward && !event.unavailableForward && (
            <div className={s.quote}>
              <SocialEventCard event={event.forward} quoted />
            </div>
          )}
          {event.unavailableForward && (
            <div className={s.quote + " " + s.muted}>{t("social.unavailable")}</div>
          )}
          {event.pictures.length > 0 && (
            <div className={s.pictures}>
              {event.pictures.map((url, index) => (
                <button
                  type="button"
                  key={url + index}
                  onClick={() => setPicture(url)}
                  aria-label={t("social.picture", { index: index + 1 })}
                >
                  <img
                    src={url}
                    alt={t("social.picture", { index: index + 1 })}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
          {quoted ? (
            <Link href={href} scroll={false} className={s.textButton}>
              {t("social.viewOriginal")}
            </Link>
          ) : (
            <div className={s.actions}>
              <Link
                scroll={false}
                href={detail ? href + "#social-comments" : href}
                className={s.action}
                aria-label={t("social.comments") + " " + event.comments}
              >
                <MessageCircle />
                <span>{event.comments || ""}</span>
              </Link>
              <button
                type="button"
                className={s.action}
                disabled={!event.user.id}
                aria-label={t("social.forward") + " " + event.forwards}
                onClick={() => void requireLogin(() => setForward(true))}
              >
                <Repeat2 />
                <span>{event.forwards || ""}</span>
              </button>
              <button
                type="button"
                className={s.action}
                data-active={event.liked}
                aria-pressed={event.liked}
                disabled={actions.liking || !event.threadId}
                title={!event.threadId ? t("social.threadMissing") : undefined}
                aria-label={t(event.liked ? "social.unlike" : "social.like") + " " + event.likes}
                onClick={() => void requireLogin(() => actions.like.mutate(!event.liked))}
              >
                <Heart />
                <span>{event.likes || ""}</span>
              </button>
              <button
                type="button"
                className={s.action}
                aria-label={t("social.share")}
                onClick={() => void copyLink()}
              >
                <Share />
              </button>
            </div>
          )}
        </div>
      </article>
      <Dialog open={forward} onOpenChange={setForward}>
        <DialogContent className={s.dialog + " sm:max-w-2xl"}>
          <DialogTitle>{t("social.forward")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("social.forwardPlaceholder")}
          </DialogDescription>
          <SocialComposer forwarded={event} onDone={() => setForward(false)} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleting}
        onOpenChange={(value) => {
          if (!actions.remove.isPending) setDeleting(value);
        }}
      >
        <DialogContent className={s.dialog}>
          <DialogTitle>{t("social.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("social.deleteHint")}</DialogDescription>
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
      <Dialog
        open={!!picture}
        onOpenChange={(value) => {
          if (!value) setPicture(undefined);
        }}
      >
        <DialogContent className={s.dialog + " sm:max-w-4xl"}>
          <DialogTitle className="sr-only">
            {t("social.picture", { index: event.pictures.indexOf(picture ?? "") + 1 })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {event.text || t("social.unknownPost")}
          </DialogDescription>
          {picture && (
            <img src={picture} alt={event.text} className="max-h-[75dvh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
