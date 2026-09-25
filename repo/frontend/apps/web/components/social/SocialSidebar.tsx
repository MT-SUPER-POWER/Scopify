"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import type { SocialTopicsProps } from "@/types/components/social";
import { SocialPeople } from "./SocialPeople";
import { SocialSearchForm } from "./SocialSearchForm";
import { SocialTopicList } from "./SocialTopicList";
import s from "./Social.module.css";

export function SocialSidebar({ selectedId }: SocialTopicsProps) {
  const { t } = useI18n();
  return (
    <aside className={s.rail} aria-label={t("social.discover")}>
      <SocialSearchForm />
      <section className={s.railSection}>
        <div className={s.sectionTitle}>
          <h2>{t("social.following")}</h2>
          <Link
            href="/social?view=people"
            scroll={false}
            className={s.iconButton}
            aria-label={t("social.allFollowing")}
            title={t("social.allFollowing")}
          >
            <ArrowUpRight />
          </Link>
        </div>
        <SocialPeople mode="following" compact />
      </section>
      <section className={s.railSection}>
        <h2 className={s.sectionTitle}>{t("social.hotTopics")}</h2>
        <SocialTopicList selectedId={selectedId} />
      </section>
      <p className={s.railFooter}>{t("social.subtitle")}</p>
    </aside>
  );
}
