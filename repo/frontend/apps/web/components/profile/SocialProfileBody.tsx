"use client";

import Link from "next/link";
import { SocialComposer } from "@/components/social/SocialComposer";
import { SocialFeed } from "@/components/social/SocialFeed";
import { SocialPeople } from "@/components/social/SocialPeople";
import { profileHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileBodyProps } from "@/types/social/components";
import { ProfileFansGroupGrid } from "./ProfileFansGroupGrid";
import { ProfileListeningRank } from "./ProfileListeningRank";
import { ProfilePlaylistShelves } from "./ProfilePlaylistShelves";
import { SocialProfilePlaylists } from "./SocialProfilePlaylists";
import s from "@/components/social/Social.module.css";

const TABS = ["overview", "playlists", "activity"] as const;

export function SocialProfileBody({ user, tab, isSelf }: SocialProfileBodyProps) {
  const { t } = useI18n();
  return (
    <main className={s.profileMain}>
      <nav className={s.tabs} aria-label={user.name}>
        {TABS.map((item) => (
          <Link
            key={item}
            href={profileHref(user.id) + "&tab=" + item}
            scroll={false}
            className={s.tab}
            data-active={tab === item}
            aria-current={tab === item ? "page" : undefined}
          >
            {t(
              item === "overview"
                ? "social.overview"
                : item === "playlists"
                  ? "social.playlists"
                  : "social.activity",
            )}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? (
        <div className={s.profileOverview}>
          <ProfileListeningRank uid={user.id} isSelf={isSelf} />
          <ProfilePlaylistShelves uid={user.id} />
          {isSelf && <ProfileFansGroupGrid />}
        </div>
      ) : tab === "playlists" ? (
        <SocialProfilePlaylists uid={user.id} />
      ) : tab === "following" || tab === "followers" ? (
        <>
          <h2 className={s.sectionTitle + " mt-6"}>
            {t(tab === "following" ? "social.following" : "social.followers")}
          </h2>
          <SocialPeople uid={user.id} mode={tab} />
        </>
      ) : (
        <div className={s.profileFeedColumn}>
          {isSelf && <SocialComposer />}
          <SocialFeed uid={user.id} grid />
        </div>
      )}
    </main>
  );
}
