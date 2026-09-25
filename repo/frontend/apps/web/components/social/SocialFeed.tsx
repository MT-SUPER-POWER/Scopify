"use client";

import { useCallback } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useSocialAccount, useSocialFeed } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialFeedProps } from "@/types/components/social";
import { SocialEventCard } from "./SocialEventCard";
import { SocialLoadMore, SocialLogin, SocialState } from "./SocialPrimitives";
import s from "./Social.module.css";

export function SocialFeed({ uid, enabled = true }: SocialFeedProps) {
  const { uid: self } = useSocialAccount(),
    { t } = useI18n();
  const query = useSocialFeed(uid, enabled);
  const { fetchNextPage } = query;
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  const load = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const sentinel = useInfiniteScrollTrigger({
    enabled: enabled && !!self && query.hasNextPage && !query.isFetching && !query.isError,
    onIntersect: load,
  });
  if (!self) return <SocialLogin />;
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      onRetry={() => void query.refetch()}
      empty={!items.length ? t(uid ? "social.emptyUserFeed" : "social.emptyFeed") : undefined}
    >
      <div className={s.timeline}>
        {items.map((event) => (
          <SocialEventCard key={event.id} event={event} />
        ))}
      </div>
      <div ref={sentinel} aria-hidden="true" />
      <SocialLoadMore
        more={query.hasNextPage}
        pending={query.isFetching}
        error={query.isError}
        onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
      />
    </SocialState>
  );
}
