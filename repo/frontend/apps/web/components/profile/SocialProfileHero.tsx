"use client";

import { SocialAvatar } from "@/components/social/SocialPrimitives";
import { useI18n } from "@/store/module/i18n";
import type { SocialProfileHeroProps } from "@/types/social/components";
import { ProfileStatsBand } from "./ProfileStatsBand";
import s from "@/components/social/Social.module.css";

export function SocialProfileHero(props: SocialProfileHeroProps) {
  const { user } = props;
  const { t } = useI18n();
  return (
    <section className={s.profileHero}>
      <div className={s.profileIdentityRow}>
        <SocialAvatar user={user} linked={false} size="large" />
        <div className={s.profileIdentityText}>
          <h1>{user.name}</h1>
          <p className={s.bio}>{user.signature || t("social.noSignature")}</p>
          {user.joinedAt && (
            <p className={s.profileJoined}>
              {t("social.joined", { year: new Date(user.joinedAt).getFullYear() })}
            </p>
          )}
        </div>
      </div>
      <ProfileStatsBand {...props} />
    </section>
  );
}
