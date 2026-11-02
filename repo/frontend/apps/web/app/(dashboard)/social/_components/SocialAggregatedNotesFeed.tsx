"use client";

import { useCallback } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/search/useInfiniteScrollTrigger";
import { useSocialAggregatedNotes } from "@/hooks/social/useSocialNotes";
import type { UserFansGroupItem } from "@/types/fansGroup/api";
import { uniqueById } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import { SocialNoteGrid } from "@/components/social/SocialNoteGrid";
import { SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";

/**
 * 聚合乐迷团笔记流组件
 * 呈现登录用户已加入的各个乐迷团的综合动态
 */

export interface SocialAggregatedNotesFeedProps {
  groups: UserFansGroupItem[];
}

/**
 * 渲染聚合乐迷团笔记流，每条笔记标注来源乐迷团
 * @param props - 已加入的乐迷团列表
 */
export function SocialAggregatedNotesFeed({ groups }: SocialAggregatedNotesFeedProps) {
  const { t } = useTranslation();
  const query = useSocialAggregatedNotes(groups.map((group) => group.fansGroupId));
  const groupById = new Map(groups.map((group) => [group.fansGroupId, group]));
  const { fetchNextPage } = query;
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);

  const load = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const sentinel = useInfiniteScrollTrigger({
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isError),
    onIntersect: load,
  });

  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      empty={!items.length ? t("social.emptyNotes") : undefined}
      onRetry={() => void query.refetch()}
    >
      <SocialNoteGrid
        items={items}
        getSource={(event) => {
          const group = event.communityId ? groupById.get(event.communityId) : undefined;
          return (
            group && {
              name: group.artistName || group.fansGroupName,
              href: `/social?group=${group.fansGroupId}`,
            }
          );
        }}
      />
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
