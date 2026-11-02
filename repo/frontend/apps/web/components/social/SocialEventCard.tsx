"use client";

import Link from "next/link";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { eventHref } from "@/lib/social/normalize";
import { formatSocialTime } from "@/lib/social/time";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { SocialEventProps } from "@/types/social/components";
import { SocialAvatar, SocialAuthor } from "./SocialPrimitives";
import { SocialEventActions } from "./SocialEventActions";
import { SocialEventMedia } from "./SocialEventMedia";
import { SocialEventMenu } from "./SocialEventMenu";
import { SocialPostText } from "./SocialPostText";
import { SocialInlineText } from "./SocialInlineText";
import { SocialResourceCard } from "./SocialResourceCard";
import { cn } from "@/lib/utils";
import {
  socialEventBodyClass,
  socialEventHeaderClass,
  socialMutedClass,
  socialPostTextClass,
  socialQuoteClass,
  socialQuoteTextClass,
  socialTextButtonClass,
} from "./socialClasses";

export function SocialEventCard({ event, quoted = false, detail = false }: SocialEventProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);
  const actions = useSocialEventActions(event);
  const href = eventHref(event);
  return (
    <article
      className={cn(
        "flex min-w-0",
        // 被引用的动态嵌在引用框里，去掉自身的分隔线与留白
        quoted
          ? "gap-2.5"
          : "gap-3.5 border-b border-foreground/10 pt-[23px] pb-[17px] max-[768px]:gap-2.5",
      )}
      data-media={event.pictures.length > 0}
    >
      <SocialAvatar user={event.user} size={quoted ? "small" : undefined} />
      <div className={socialEventBodyClass}>
        <div className={socialEventHeaderClass}>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1 pt-[5px]">
            <SocialAuthor user={event.user} />
            {event.time > 0 && (
              <Link href={href} scroll={false} title={new Date(event.time).toLocaleString(locale)}>
                <time dateTime={new Date(event.time).toISOString()}>
                  {formatSocialTime(event.time, locale)}
                </time>
              </Link>
            )}
            {event.privacy !== undefined && event.privacy !== 0 && (
              <span className="text-[11px] text-muted-foreground">
                {t(event.privacy === 2 ? "social.selfOnly" : "social.restricted")}
              </span>
            )}
          </div>
          {!quoted && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <SocialEventMenu
                event={event}
                pending={actions.remove.isPending}
                onDelete={(onSuccess) => actions.remove.mutate(undefined, { onSuccess })}
              />
            </div>
          )}
        </div>
        {event.title && (
          <h2
            className={cn(
              quoted ? "text-[15px]" : "text-[19px] @max-[500px]:text-[17px]",
              "mt-2 mb-1 leading-normal font-[650] wrap-anywhere",
            )}
          >
            <Link href={href} scroll={false} className="hover:underline hover:underline-offset-4">
              <SocialInlineText text={event.title} />
            </Link>
          </h2>
        )}
        {event.text ? (
          <SocialPostText text={event.text} expanded={detail} />
        ) : (
          !event.title &&
          !event.resource &&
          !event.forward &&
          !event.pictures.length && (
            <p
              data-slot="social-post-text"
              className={cn(socialPostTextClass, "text-muted-foreground")}
            >
              {t("social.unknownPost")}
            </p>
          )
        )}
        {event.forward && !event.unavailableForward && (
          <div className={cn(socialQuoteClass, socialQuoteTextClass)}>
            <SocialEventCard event={event.forward} quoted />
          </div>
        )}
        {event.unavailableForward && (
          <div className={cn(socialQuoteClass, socialMutedClass)}>{t("social.unavailable")}</div>
        )}
        {event.pictures.length > 0 && <SocialEventMedia event={event} />}
        {event.resource && <SocialResourceCard resource={event.resource} compact={quoted} />}
        {quoted ? (
          <Link href={href} scroll={false} className={socialTextButtonClass}>
            {t("social.viewOriginal")}
          </Link>
        ) : (
          <SocialEventActions
            event={event}
            detail={detail}
            liking={actions.liking}
            onLike={() => actions.like.mutate(!event.liked)}
          />
        )}
      </div>
    </article>
  );
}
