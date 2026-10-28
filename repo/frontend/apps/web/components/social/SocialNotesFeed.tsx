"use client";

import { useCallback } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useSocialNotes } from "@/hooks/social/useSocialNotes";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialNotesFeedProps } from "@/types/social/components";
import { SocialNoteGrid } from "./SocialNoteGrid";
import { SocialLoadMore, SocialState } from "./SocialPrimitives";

export function SocialNotesFeed({ groupId }: SocialNotesFeedProps) {
  const { t } = useI18n();
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
