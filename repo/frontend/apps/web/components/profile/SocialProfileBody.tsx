"use client";

import Link from "next/link";
import { SocialComposer } from "@/components/social/SocialComposer";
import { SocialFeed } from "@/components/social/SocialFeed";
import { SocialPeople } from "@/components/social/SocialPeople";
import { profileHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileBodyProps } from "@/types/components/social";
import { SocialProfilePlaylists } from "./SocialProfilePlaylists";
import s from "@/components/social/Social.module.css";

export function SocialProfileBody({ user, tab, isSelf }: SocialProfileBodyProps) {
  const { t } = useI18n();
  return (
    <main className={s.profileMain}>
      <nav className={s.tabs} aria-label={user.name}>
        {(["activity", "playlists", "about"] as const).map((item) => (
          <Link
            key={item}
            href={profileHref(user.id) + "&tab=" + item}
            scroll={false}
            className={s.tab}
            data-active={tab === item}
            aria-current={tab === item ? "page" : undefined}
          >
            {t(
              item === "activity"
                ? "social.activity"
                : item === "playlists"
                  ? "social.playlists"
                  : "social.about",
            )}
            {item === "activity" && user.events > 0 && (
              <span className="ml-2 text-xs text-content-muted">{user.events}</span>
            )}
          </Link>
        ))}
      </nav>
      {tab === "playlists" ? (
        <SocialProfilePlaylists uid={user.id} />
      ) : tab === "about" ? (
        <section className={s.about}>
          <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
          <dl>
            {user.level !== undefined && (
              <>
                <dt>{t("social.level")}</dt>
                <dd>Lv. {user.level}</dd>
              </>
            )}
            {user.listenSongs !== undefined && (
              <>
                <dt>{t("social.listened")}</dt>
                <dd>{t("social.tracks", { count: user.listenSongs })}</dd>
              </>
            )}
            <dt>{t("social.activity")}</dt>
            <dd>{user.events}</dd>
          </dl>
        </section>
      ) : tab === "following" || tab === "followers" ? (
        <>
          <h2 className={s.sectionTitle + " mt-6"}>
            {t(tab === "following" ? "social.following" : "social.followers")}
          </h2>
          <SocialPeople uid={user.id} mode={tab} />
        </>
      ) : (
        <>
          {isSelf && <SocialComposer />}
          <SocialFeed uid={user.id} />
        </>
      )}
    </main>
  );
}
