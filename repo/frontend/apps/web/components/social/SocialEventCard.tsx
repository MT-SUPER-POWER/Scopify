"use client";

import Link from "next/link";
import { useSocialEventActions } from "@/hooks/social/useSocialActions";
import { eventHref } from "@/lib/social/normalize";
import { formatSocialTime } from "@/lib/social/time";
import { useI18n } from "@/store/module/i18n";
import type { SocialEventProps } from "@/types/components/social";
import { FollowButton, SocialAvatar, SocialAuthor } from "./SocialPrimitives";
import { SocialEventActions } from "./SocialEventActions";
import { SocialEventMedia } from "./SocialEventMedia";
import { SocialEventMenu } from "./SocialEventMenu";
import { SocialPostText } from "./SocialPostText";
import { SocialResourceCard } from "./SocialResourceCard";
import s from "./Social.module.css";

export function SocialEventCard({
  event,
  quoted = false,
  detail = false,
  showFollow = false,
}: SocialEventProps) {
  const { t, locale } = useI18n();
  const actions = useSocialEventActions(event);
  const href = eventHref(event);
  return (
    <article className={s.event} data-media={event.pictures.length > 0}>
      <SocialAvatar user={event.user} size={quoted ? "small" : undefined} />
      <div className={s.eventBody}>
        <div className={s.eventHeader}>
          <div className={s.eventIdentity}>
            <SocialAuthor user={event.user} />
            {event.time > 0 && (
              <Link href={href} scroll={false} title={new Date(event.time).toLocaleString(locale)}>
                <time dateTime={new Date(event.time).toISOString()}>
                  {formatSocialTime(event.time, locale)}
                </time>
              </Link>
            )}
            {event.privacy !== undefined && event.privacy !== 0 && (
              <span className={s.privateNote}>
                {t(event.privacy === 2 ? "social.selfOnly" : "social.restricted")}
              </span>
            )}
          </div>
          {!quoted && (
            <div className={s.eventTools}>
              {showFollow && <FollowButton user={event.user} className={s.inlineFollow} />}
              <SocialEventMenu
                event={event}
                pending={actions.remove.isPending}
                onDelete={(onSuccess) => actions.remove.mutate(undefined, { onSuccess })}
              />
            </div>
          )}
        </div>
        {event.title && (
          <h2 className={s.postTitle}>
            <Link href={href} scroll={false}>
              {event.title}
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
            <p className={s.postText + " " + s.muted}>{t("social.unknownPost")}</p>
          )
        )}
        {event.forward && !event.unavailableForward && (
          <div className={s.quote}>
            <SocialEventCard event={event.forward} quoted />
          </div>
        )}
        {event.unavailableForward && (
          <div className={s.quote + " " + s.muted}>{t("social.unavailable")}</div>
        )}
        {event.pictures.length > 0 && <SocialEventMedia event={event} />}
        {event.resource && <SocialResourceCard resource={event.resource} compact={quoted} />}
        {quoted ? (
          <Link href={href} scroll={false} className={s.textButton}>
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
