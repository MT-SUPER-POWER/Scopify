"use client";

import Link from "next/link";
import { useSocialPlaylists } from "@/hooks/social/useSocialQueries";
import { profileHref, uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import { SocialState } from "@/components/social/SocialPrimitives";
import type { ProfilePlaylistShelvesProps } from "@/types/social/components";
import { ProfilePlaylistTile } from "./ProfilePlaylistTile";
import s from "@/components/social/Social.module.css";

const SHELF_SIZE = 6;

export function ProfilePlaylistShelves({ uid }: ProfilePlaylistShelvesProps) {
  const { t } = useI18n();
  const query = useSocialPlaylists(uid);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []);
  const shelves = [
    { key: "created", title: t("social.created"), items: items.filter((i) => i.creator === uid) },
    { key: "saved", title: t("social.saved"), items: items.filter((i) => i.creator !== uid) },
  ].filter((shelf) => shelf.items.length);
  return (
    <SocialState
      loading={query.isPending}
      error={query.isError && !items.length}
      empty={!items.length ? t("social.emptyPlaylists") : undefined}
      onRetry={() => void query.refetch()}
    >
      {shelves.map((shelf) => (
        <section key={shelf.key} className={s.profileSection}>
          <div className={s.sectionTitle}>
            <h2>{shelf.title}</h2>
            <Link
              href={profileHref(uid) + "&tab=playlists"}
              scroll={false}
              className={s.textButton}
            >
              {t("social.all")}
            </Link>
          </div>
          <div className={s.profileShelf}>
            {shelf.items.slice(0, SHELF_SIZE).map((item) => (
              <ProfilePlaylistTile key={item.id} item={item} caption={shelf.title} />
            ))}
          </div>
        </section>
      ))}
    </SocialState>
  );
}
