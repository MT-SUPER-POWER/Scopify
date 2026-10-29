import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { FollowButton } from "@/components/social/SocialPrimitives";
import { profileHref } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { ProfileStatsBandProps } from "@/types/social/components";
import s from "@/components/social/Social.module.css";

export function ProfileStatsBand({ user, isSelf, onEdit, onMessage }: ProfileStatsBandProps) {
  const { t } = useI18n();
  const base = profileHref(user.id);
  const stats = [
    { key: "level", label: t("social.level"), value: user.level, text: "Lv." + user.level },
    { key: "listened", label: t("social.listened"), value: user.listenSongs },
    { key: "following", label: t("social.following"), value: user.following, tab: "following" },
    { key: "followers", label: t("social.followers"), value: user.followers, tab: "followers" },
    { key: "events", label: t("social.activity"), value: user.events, tab: "activity" },
  ].filter((stat) => stat.value !== undefined);
  return (
    <div className={s.profileStats}>
      {stats.map((stat) => {
        const body = (
          <>
            <strong>{stat.text ?? stat.value?.toLocaleString()}</strong>
            <span>{stat.label}</span>
          </>
        );
        return stat.tab ? (
          <Link
            key={stat.key}
            href={base + "&tab=" + stat.tab}
            scroll={false}
            className={s.profileStat}
          >
            {body}
          </Link>
        ) : (
          <div key={stat.key} className={s.profileStat}>
            {body}
          </div>
        );
      })}
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
  );
}
