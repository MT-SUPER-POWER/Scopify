"use client";

import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useSocialPlaylists } from "@/hooks/social/useSocialQueries";
import { profileHref, uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileAsideProps } from "@/types/components/social";
import { SocialState } from "@/components/social/SocialPrimitives";
import s from "@/components/social/Social.module.css";

export function SocialProfileAside({ user, isSelf }: SocialProfileAsideProps) {
  const { t } = useI18n();
  const query = useSocialPlaylists(user.id);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? [])
    .filter((item) => item.creator === user.id)
    .slice(0, 3);
  return (
    <aside className={s.profilePlaylistRail}>
      <section className={s.railSection}>
        <div className={s.sectionTitle}>
          <h2>{t("social.created")}</h2>
          <Link
            href={profileHref(user.id) + "&tab=playlists"}
            scroll={false}
            className={s.textButton}
          >
            {t("social.all")}
          </Link>
        </div>
        <SocialState
          loading={query.isPending}
          error={query.isError && !items.length}
          empty={!items.length ? t("social.emptyPlaylists") : undefined}
          onRetry={() => void query.refetch()}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={"/playlist?id=" + item.id}
              scroll={false}
              className={s.miniPlaylist}
            >
              <span className={s.cover}>
                {item.cover ? (
                  <img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <Disc3 />
                )}
              </span>
              <span className={s.personText}>
                <strong>{item.name}</strong>
                <span className={s.playlistTrackCount}>
                  {t("social.tracks", { count: item.count })}
                </span>
              </span>
            </Link>
          ))}
        </SocialState>
      </section>
      {isSelf && (
        <Link href="/recent" scroll={false} className={s.textButton}>
          {t("social.recent")} →
        </Link>
      )}
    </aside>
  );
}
