"use client";

import { useSocialPlaylists } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import { SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";
import type { SocialFeedProps } from "@/types/social/components";
import { ProfilePlaylistTile } from "./ProfilePlaylistTile";
import s from "@/components/social/Social.module.css";

export function SocialProfilePlaylists({ uid = "" }: SocialFeedProps) {
  const { t } = useI18n(),
    query = useSocialPlaylists(uid);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      onRetry={() => void query.refetch()}
      empty={!items.length ? t("social.emptyPlaylists") : undefined}
    >
      <div className={s.playlistGrid}>
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
