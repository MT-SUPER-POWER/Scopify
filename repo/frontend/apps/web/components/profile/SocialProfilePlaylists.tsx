"use client";

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useSocialPlaylists } from "@/hooks/social/useSocialQueries";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import { SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";
import type { SocialFeedProps } from "@/types/components/social";
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
          <Link
            key={item.id}
            href={"/playlist?id=" + item.id}
            scroll={false}
            className={s.playlistTile}
          >
            <span className={s.cover}>
              {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <Disc3 />}
            </span>
            <strong>{item.name}</strong>
            <p>
              {t("social.tracks", { count: item.count })} ·{" "}
              {t(item.creator === uid ? "social.created" : "social.saved")}
            </p>
          </Link>
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
