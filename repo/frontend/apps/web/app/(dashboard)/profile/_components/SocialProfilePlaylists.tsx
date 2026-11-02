"use client";

import { useSocialPlaylists } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import { SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";
import type { SocialFeedProps } from "@/types/social/components";
import { ProfilePlaylistTile } from "./ProfilePlaylistTile";

export function SocialProfilePlaylists({ uid = "" }: SocialFeedProps) {
  const { t } = useTranslation(),
    query = useSocialPlaylists(uid);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      onRetry={() => void query.refetch()}
      empty={!items.length ? t("social.emptyPlaylists") : undefined}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(172px,1fr))] gap-x-5 gap-y-6 py-6">
        {items.map((item) => (
          <ProfilePlaylistTile
            key={item.id}
            item={item}
            caption={t(item.creator === uid ? "social.created" : "social.saved")}
          />
        ))}
      </div>
      <SocialLoadMore
        more={query.hasNextPage}
        pending={query.isFetching}
        error={query.isError}
        onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
      />
    </SocialState>
  );
}
