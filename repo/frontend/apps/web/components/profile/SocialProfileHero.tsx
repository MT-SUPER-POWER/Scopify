"use client";

import { CalendarDays, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { FollowButton, SocialAvatar } from "@/components/social/SocialPrimitives";
import { profileHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileHeroProps } from "@/types/components/social";
import s from "@/components/social/Social.module.css";

export function SocialProfileHero({ user, isSelf, onEdit, onMessage }: SocialProfileHeroProps) {
  const { t } = useI18n();
  return (
    <section className={s.profileHero}>
      <div className={s.profileIdentityRow}>
        <SocialAvatar user={user} linked={false} size="large" />
        <div className={s.profileIdentityText}>
          <h1>{user.name}</h1>
          <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
          <div className={s.profileMeta}>
            {user.joinedAt && (
              <span className={s.row}>
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {t("social.joined", { year: new Date(user.joinedAt).getFullYear() })}
              </span>
            )}
            <Link href={profileHref(user.id) + "&tab=following"} scroll={false}>
              <strong>{user.following}</strong> {t("social.following")}
            </Link>
            <Link href={profileHref(user.id) + "&tab=followers"} scroll={false}>
              <strong>{user.followers}</strong> {t("social.followers")}
            </Link>
          </div>
        </div>
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
    </section>
  );
}
