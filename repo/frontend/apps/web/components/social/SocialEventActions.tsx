"use client";

import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useSocialShare } from "@/hooks/social/useSocialShare";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { eventHref } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { SocialEventActionsProps } from "@/types/social/components";
import { SocialComposer } from "./SocialComposer";
import { cn } from "@/lib/utils";
import { socialActionClass, socialActionsClass, socialDialogClass } from "./socialClasses";

export function SocialEventActions({ event, detail, liking, onLike }: SocialEventActionsProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const requireLogin = useRequireLoginAction();
  const copyLink = useSocialShare(event);
  const [forward, setForward] = useState(false);
  const format = (count: number) =>
    count ? new Intl.NumberFormat(locale, { notation: "compact" }).format(count) : "";
  const href = eventHref(event);
  return (
    <>
      <div className={socialActionsClass}>
        <Link
          scroll={false}
          href={detail ? href + "#social-comments" : href}
          className={socialActionClass}
          aria-label={t("social.comments") + " " + event.comments}
          title={t("social.comments")}
        >
          <MessageCircle />
          <span>{format(event.comments)}</span>
        </Link>
        <button
          type="button"
          className={socialActionClass}
          disabled={!event.user.id}
          aria-label={t("social.forward") + " " + event.forwards}
          title={t("social.forward")}
          onClick={() => void requireLogin(() => setForward(true))}
        >
          <Repeat2 />
          <span>{format(event.forwards)}</span>
        </button>
        <button
          type="button"
          className={socialActionClass}
          data-active={event.liked}
          aria-pressed={event.liked}
          disabled={liking || !event.threadId}
          title={t(
            !event.threadId
              ? "social.threadMissing"
              : event.liked
                ? "social.unlike"
                : "social.like",
          )}
          aria-label={t(event.liked ? "social.unlike" : "social.like") + " " + event.likes}
          onClick={() => void requireLogin(onLike)}
        >
          <Heart />
          <span>{format(event.likes)}</span>
        </button>
        <button
          type="button"
          className={socialActionClass}
          aria-label={t("social.share")}
          title={t("social.share")}
          onClick={() => void copyLink()}
        >
          <Share />
        </button>
      </div>
      <Dialog open={forward} onOpenChange={setForward}>
        <DialogContent className={cn(socialDialogClass, "sm:max-w-2xl")}>
          <DialogTitle>{t("social.forward")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("social.forwardPlaceholder")}
          </DialogDescription>
          <SocialComposer forwarded={event} onDone={() => setForward(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
