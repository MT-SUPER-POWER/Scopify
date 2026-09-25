"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { useNavigationScroll } from "@/components/shared/NavigationScrollProvider";
import Link from "next/link";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialGroup } from "@/hooks/social/useSocialNotes";
import { socialKey } from "@/lib/social/cache";
import { useI18n } from "@/store/module/i18n";
import type { SocialHeaderProps } from "@/types/components/social";
import { SocialPublishButton } from "./SocialPublishButton";
import s from "./Social.module.css";

export function SocialHeader({ view, topicId, groupId }: SocialHeaderProps) {
  const { t } = useI18n();
  const { isAtTop } = useNavigationScroll();
  const { uid, account } = useSocialAccount();
  const client = useQueryClient();
  const group = useSocialGroup(view === "hot" && !topicId ? groupId : "");
  const queryKey =
    view === "people"
      ? socialKey(account, "people")
      : view === "friends"
        ? socialKey(account, "events", "home")
        : topicId
          ? socialKey(account, "events", "topic", topicId)
          : socialKey(account, "events", "community", groupId);
  const refreshing = useIsFetching({ queryKey }) > 0;
  return (
    <header className={s.streamHeader} data-top={isAtTop}>
      <div className={s.streamToolbar}>
        <h1>{t("social.title")}</h1>
        <nav className={s.tabs} aria-label={t("social.title")}>
          <Link
            href="/social?view=following"
            scroll={false}
            className={s.tab}
            data-active={view === "friends"}
            aria-current={view === "friends" ? "page" : undefined}
          >
            {t("social.followingTab")}
          </Link>
          <Link
            href="/social"
            scroll={false}
            className={s.tab}
            data-active={view === "hot"}
            aria-current={view === "hot" ? "page" : undefined}
          >
            {t("social.hot")}
          </Link>
        </nav>
        <SocialPublishButton />
      </div>
      <div className={s.feedToolbar}>
        {topicId || view === "people" ? (
          <p>{t(topicId ? "social.hotTopics" : "social.people")}</p>
        ) : (
          <p className={s.feedDescription}>
            <span>{t(view === "friends" ? "social.peopleHint" : "social.hotDescription")}</span>
            {group.data && (
              <span className={s.sourceLabel} title={group.data.name}>
                {t("social.communitySource", { name: group.data.name })}
              </span>
            )}
          </p>
        )}
        <div className={s.row}>
          <Link
            href="/social?view=people"
            scroll={false}
            className={s.iconButton}
            aria-label={t("social.searchPeople")}
            title={t("social.searchPeople")}
          >
            <Search />
          </Link>
          <button
            type="button"
            className={s.refreshButton}
            disabled={!uid || refreshing}
            onClick={() => void client.invalidateQueries({ queryKey })}
          >
            <RefreshCw
              className={refreshing ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
            <span>{t("social.refresh")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
