"use client";

import { useState } from "react";
import Link from "next/link";
import { useSocialHotTopics } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialTopicsProps } from "@/types/components/social";
import { SocialLoadMore, SocialState } from "./SocialPrimitives";
import s from "./Social.module.css";

export function SocialTopicList({ selectedId }: SocialTopicsProps) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const query = useSocialHotTopics();
  const topics = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  const visible = expanded ? topics : topics.slice(0, 4);
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !topics.length}
      empty={!topics.length ? t("social.emptyTopics") : undefined}
      onRetry={() => void query.refetch()}
    >
      <ul className={s.topicList}>
        {visible.map((topic) => (
          <li key={topic.id}>
            <Link
              scroll={false}
              href={
                "/social?" +
                new URLSearchParams({ view: "hot", topic: topic.id, title: topic.title })
              }
              className={s.topicLink}
              data-active={selectedId === topic.id}
              aria-current={selectedId === topic.id ? "page" : undefined}
            >
              <span className={s.topicLabel}>
                <strong>{topic.title}</strong>
                {topic.description ? (
                  <span>{topic.description}</span>
                ) : (
                  topic.participants > 0 && (
                    <span>
                      {t("social.topicParticipants", {
                        count: new Intl.NumberFormat(locale, { notation: "compact" }).format(
                          topic.participants,
                        ),
                      })}
                    </span>
                  )
                )}
              </span>
              {topic.cover && (
                <img src={topic.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      {!expanded && topics.length > 4 ? (
        <button className={s.textButton} type="button" onClick={() => setExpanded(true)}>
          {t("social.moreTopics")}
        </button>
      ) : (
        (query.hasNextPage || query.isError) && (
          <SocialLoadMore
            more={query.hasNextPage}
            pending={query.isFetching}
            error={query.isError}
            onLoad={() => {
              setExpanded(true);
              void (query.isRefetchError ? query.refetch() : query.fetchNextPage());
            }}
          />
        )
      )}
    </SocialState>
  );
}
