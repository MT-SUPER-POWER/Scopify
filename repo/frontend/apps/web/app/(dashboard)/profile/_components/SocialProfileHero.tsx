"use client";

import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { FollowButton, SocialAvatar } from "@/components/social/SocialPrimitives";
import { profileHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileHeroProps } from "@/types/social/components";
import s from "@/components/social/Social.module.css";

export function SocialProfileHero({ user, isSelf, onEdit, onMessage }: SocialProfileHeroProps) {
  const { t } = useI18n();
  const base = profileHref(user.id);
  return (
    <section className={s.profileHero}>
      <div className={s.profileIdentityRow}>
        <SocialAvatar user={user} linked={false} size="large" />
        <div className={s.profileIdentityText}>
          <div className={s.profileTitleRow}>
            <h1>{user.name}</h1>
            <div className={s.profileHeroActions}>
              {isSelf ? (
                <button type="button" className={s.button} onClick={onEdit}>
                  {t("social.edit")}
                </button>
              ) : (
                <>
                  <FollowButton user={user} />
                  <button type="button" className={s.button} onClick={onMessage}>
                    <MessagesSquare className="size-4" aria-hidden="true" />
                    {t("social.message")}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
          <div className={s.profileFacts}>
            {user.level !== undefined && <span>Lv.{user.level}</span>}
            {user.listenSongs !== undefined && (
              <span>{t("social.listenedCount", { count: user.listenSongs.toLocaleString() })}</span>
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
