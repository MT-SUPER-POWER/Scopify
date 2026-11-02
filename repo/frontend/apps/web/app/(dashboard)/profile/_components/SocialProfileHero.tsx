"use client";

import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { FollowButton, SocialAvatar } from "@/components/social/SocialPrimitives";
import { profileHref } from "@/lib/social/normalize";
import { useTranslation } from "react-i18next";

import type { SocialProfileHeroProps } from "@/types/social/components";
import { cn } from "@/lib/utils";
import {
  profileHeroActionsClass,
  profileHeroClass,
  profileIdentityRowClass,
  profileIdentityTextClass,
  profileNameSizeClass,
  profileTitleRowClass,
  socialButtonClass,
} from "@/components/social/socialClasses";

export function SocialProfileHero({ user, isSelf, onEdit, onMessage }: SocialProfileHeroProps) {
  const { t } = useTranslation();
  const base = profileHref(user.id);
  return (
    <section className={profileHeroClass}>
      <div className={profileIdentityRowClass}>
        <SocialAvatar user={user} linked={false} size="large" />
        <div className={profileIdentityTextClass}>
          <div className={profileTitleRowClass}>
            <h1
              className={cn(
                profileNameSizeClass,
                "leading-1.1 min-w-0 font-extrabold tracking-[-0.03em] wrap-anywhere",
              )}
            >
              {user.name}
            </h1>
            <div className={profileHeroActionsClass}>
              {isSelf ? (
                <button type="button" className={socialButtonClass} onClick={onEdit}>
                  {t("social.edit")}
                </button>
              ) : (
                <>
                  <FollowButton user={user} />
                  <button type="button" className={socialButtonClass} onClick={onMessage}>
                    <MessagesSquare className="size-4" aria-hidden="true" />
                    {t("social.message")}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="line-clamp-2 max-w-195 text-[14px] leading-normal wrap-anywhere whitespace-pre-wrap text-muted-foreground">
            {user.signature || t("social.noSignature")}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center text-[14px] leading-normal text-muted-foreground [&_a:hover]:text-primary [&>span+span]:before:mx-2 [&>span+span]:before:content-['·']">
            {user.level !== undefined && <span>Lv.{user.level}</span>}
            {user.listenSongs !== undefined && (
              <span>
                {t("social.listenedCount", {
                  count: user.listenSongs,
                  replace: { count: user.listenSongs.toLocaleString() },
                })}
              </span>
            )}
            <span>
              <Link href={base + "&tab=following"} scroll={false}>
                {user.following.toLocaleString()} {t("social.following")}
              </Link>
            </span>
            <span>
              <Link href={base + "&tab=followers"} scroll={false}>
                {user.followers.toLocaleString()} {t("social.followers")}
              </Link>
            </span>
            {user.joinedAt ? (
              <span>{t("social.joined", { year: new Date(user.joinedAt).getFullYear() })}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
