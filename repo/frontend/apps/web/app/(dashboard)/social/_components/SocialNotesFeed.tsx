"use client";

import { useCallback } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useSocialNotes } from "@/hooks/social/useSocialNotes";
import { uniqueById } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import type { SocialNotesFeedProps } from "@/types/social/components";
import { SocialNoteGrid } from "@/components/social/SocialNoteGrid";
import { SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";

export function SocialNotesFeed({ groupId }: SocialNotesFeedProps) {
  const { t } = useTranslation();
  const query = useSocialNotes(groupId);
  const { fetchNextPage } = query;
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  const load = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const sentinel = useInfiniteScrollTrigger({
    enabled: query.hasNextPage && !query.isFetching && !query.isError,
    onIntersect: load,
  });
  return (
    <>
      <SocialState
        loading={query.isPending}
        error={query.isError && !items.length}
        empty={!items.length ? t("social.emptyNotes") : undefined}
        onRetry={() => void query.refetch()}
      >
        <SocialNoteGrid items={items} />
        <div ref={sentinel} aria-hidden="true" />
        <SocialLoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          error={query.isError}
          onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
        />
      </SocialState>
    </>
  );
}
