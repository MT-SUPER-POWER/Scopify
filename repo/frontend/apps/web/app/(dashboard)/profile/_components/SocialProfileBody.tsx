"use client";

import Link from "next/link";
import { SocialComposer } from "@/components/social/SocialComposer";
import { SocialFeed } from "@/components/social/SocialFeed";
import { SocialPeople } from "@/components/social/SocialPeople";
import { profileHref } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import type { SocialProfileBodyProps } from "@/types/social/components";
import { ProfileFansGroupGrid } from "./ProfileFansGroupGrid";
import { ProfileListeningRank } from "./ProfileListeningRank";
import { ProfilePlaylistShelves } from "./ProfilePlaylistShelves";
import { SocialProfilePlaylists } from "./SocialProfilePlaylists";
import { cn } from "@/lib/utils";
import {
  profileMainClass,
  profileOverviewClass,
  profileTabsClass,
  socialSectionTitleClass,
  socialUnderlineTabClass,
} from "@/components/social/socialClasses";

/**
 * 个人主页动态栏：发布框收成一张输入卡片，未聚焦且没有草稿与附件时隐藏底栏；
 * 瀑布流卡片都是本人的动态，隐藏头像与作者名。
 */
const profileFeedColumnClass = [
  "mt-5",
  "[&_[data-slot=social-composer]]:mb-3 [&_[data-slot=social-composer]]:items-start [&_[data-slot=social-composer]]:gap-3 [&_[data-slot=social-composer]]:rounded-[12px] [&_[data-slot=social-composer]]:bg-foreground/6 [&_[data-slot=social-composer]]:px-3.5 [&_[data-slot=social-composer]]:py-2.5",
  "[&_[data-slot=social-composer]:focus-within]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_50%,transparent)]",
  // 头像是发布框的第一个子元素
  "[&_[data-slot=social-composer]>:first-child]:size-9 [&_[data-slot=social-composer]>:first-child]:max-[768px]:size-9",
  "[&_[data-slot=social-composer]_textarea]:field-sizing-content [&_[data-slot=social-composer]_textarea]:max-h-60 [&_[data-slot=social-composer]_textarea]:min-h-9 [&_[data-slot=social-composer]_textarea]:resize-none [&_[data-slot=social-composer]_textarea]:py-1.5 [&_[data-slot=social-composer]_textarea]:text-[15px] [&_[data-slot=social-composer]_textarea]:leading-[1.6] [&_[data-slot=social-composer]_textarea:focus-visible]:outline-none",
  "[&_[data-slot=social-composer-footer]]:mt-1.5 [&_[data-slot=social-composer-footer]]:border-t [&_[data-slot=social-composer-footer]]:border-foreground/10 [&_[data-slot=social-composer-footer]]:pt-2.5",
  "[&_[data-slot=social-composer]:not(:focus-within):not(:has(textarea:not(:placeholder-shown))):not(:has([data-slot=social-resource]))_[data-slot=social-composer-footer]]:hidden",
  "[&_[data-slot=social-composer]_button[type=submit]:disabled]:bg-foreground/12 [&_[data-slot=social-composer]_button[type=submit]:disabled]:text-muted-foreground [&_[data-slot=social-composer]_button[type=submit]:disabled]:opacity-100",
  "[&_[data-slot=social-tile-meta]>:first-child]:hidden [&_[data-slot=social-tile-author]>:first-child]:hidden [&_[data-slot=social-tile-author]>:not(:first-child)]:before:content-none",
].join(" ");

const TABS = ["overview", "playlists", "activity"] as const;

export function SocialProfileBody({ user, tab, isSelf }: SocialProfileBodyProps) {
  const { t } = useTranslation();
  return (
    <main className={profileMainClass}>
      <nav className={profileTabsClass} aria-label={user.name}>
        {TABS.map((item) => (
          <Link
            key={item}
            href={profileHref(user.id) + "&tab=" + item}
            scroll={false}
            className={socialUnderlineTabClass}
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
        <div className={profileOverviewClass}>
          <ProfileListeningRank uid={user.id} isSelf={isSelf} />
          <ProfilePlaylistShelves uid={user.id} />
          {isSelf && <ProfileFansGroupGrid />}
        </div>
      ) : tab === "playlists" ? (
        <SocialProfilePlaylists uid={user.id} />
      ) : tab === "following" || tab === "followers" ? (
        <>
          <h2 className={cn(socialSectionTitleClass, "mt-6")}>
            {t(tab === "following" ? "social.following" : "social.followers")}
          </h2>
          <SocialPeople uid={user.id} mode={tab} />
        </>
      ) : (
        <div className={profileFeedColumnClass}>
          {isSelf && <SocialComposer />}
          <SocialFeed uid={user.id} grid />
        </div>
      )}
    </main>
  );
}
