"use client";

import { useSocialTopicEvents } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialHotFeedProps } from "@/types/components/social";
import { SocialEventCard } from "./SocialEventCard";
import { SocialState } from "./SocialPrimitives";
import s from "./Social.module.css";

export function SocialHotFeed({ topic }: SocialHotFeedProps) {
  const { t, locale } = useI18n();
  const query = useSocialTopicEvents(topic.id);
  const events = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  return (
    <>
      <section className={s.topicIntro}>
        <div className={s.topicIntroText}>
          <span className={s.eyebrow}>{t("social.hotTopics")}</span>
          <h2>{topic.title}</h2>
          {topic.description && <p>{topic.description}</p>}
          {topic.participants > 0 && (
            <span className={s.muted}>
              {t("social.topicParticipants", {
                count: new Intl.NumberFormat(locale, { notation: "compact" }).format(
                  topic.participants,
                ),
              })}
            </span>
          )}
        </div>
        {topic.cover && (
          <img src={topic.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        )}
      </section>
      <SocialState
        loading={query.isPending}
        error={query.isError && !events.length}
        empty={!events.length ? t("social.emptyTopicFeed") : undefined}
        onRetry={() => void query.refetch()}
      >
        {query.isError && (
          <div className={s.refreshNotice} role="alert">
            {t("social.refreshFailed")}{" "}
            <button type="button" className={s.textButton} onClick={() => void query.refetch()}>
              {t("social.retry")}
            </button>
          </div>
        )}
        <div className={s.timeline}>
          {events.map((event) => (
            <SocialEventCard key={event.id} event={event} showFollow />
          ))}
        </div>
        <p className={s.loadMore}>{t("social.topicEnd")}</p>
      </SocialState>
    </>
  );
}
