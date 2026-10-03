"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, RefreshCw, UserPlus } from "lucide-react";
import Image from "next/image";
import { useIsScrollAtTop } from "@/components/shared/NavigationScrollProvider";
import Link from "next/link";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialGroup } from "@/hooks/social/useSocialNotes";
import { socialKey } from "@/lib/social/cache";
import { useI18n } from "@/store/module/i18n";
import type { SocialHeaderProps } from "@/types/components/social";
import { SocialPublishButton } from "./SocialPublishButton";
import s from "./Social.module.css";

/**
 * 动态页头部：只有「标题 / 标签 / 操作」一行吸顶，
 * 下方说明当前内容来源的上下文行随内容滚走，避免滚动时顶部过重。
 */
export function SocialHeader({ view, topic, groupId, groups }: SocialHeaderProps) {
  const { t } = useI18n();
  const isAtTop = useIsScrollAtTop();
  const { uid, account } = useSocialAccount();
  const client = useQueryClient();
  const hasGroups = groups.length > 0;
  const discoverTab = t(hasGroups ? "social.fansGroupTab" : "social.squareTab");
  const selectedGroup = groups.find((group) => group.fansGroupId === groupId);
  const community = useSocialGroup(view === "hot" && !topic && !hasGroups ? groupId : "");
  const queryKey =
    view === "people"
      ? socialKey(account, "people")
      : view === "friends"
        ? socialKey(account, "events", "home")
        : topic
          ? socialKey(account, "events", "topic", topic.id)
          : groupId === "all"
            ? socialKey(account, "events", "community", "aggregated")
            : socialKey(account, "events", "community", groupId);
  const refreshing = useIsFetching({ queryKey }) > 0;

  let context;
  if (view === "people" || topic) {
    context = (
      <Link href="/social" scroll={false} className={s.contextBack}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {view === "people" ? t("social.backToFeed") : t("social.backTo", { name: discoverTab })}
      </Link>
    );
  } else if (view === "friends") {
    context = <span>{t("social.followingContext")}</span>;
  } else if (selectedGroup) {
    const level = selectedGroup.userLevel?.level;
    context = (
      <span className={s.contextGroup}>
        {selectedGroup.headAvatarUrl && (
          <Image
            src={`${selectedGroup.headAvatarUrl}?param=48y48`}
            alt=""
            width={20}
            height={20}
            className="size-5 rounded-full object-cover"
          />
        )}
        <strong title={selectedGroup.fansGroupName}>{selectedGroup.fansGroupName}</strong>
        {level ? <span className={s.contextLevel}>Lv.{level}</span> : null}
        <Link
          href={`/artist?id=${selectedGroup.headId}`}
          className={s.contextLink}
          title={t("social.viewArtist")}
        >
          {t("social.viewArtist")}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      </span>
    );
  } else if (hasGroups) {
    context = <span>{t("social.aggregatedContext", { count: groups.length })}</span>;
  } else {
    context = (
      <span className={s.contextGroup}>
        <span>{t("social.squareContext")}</span>
        {community.data && (
          <span className={s.sourceLabel} title={community.data.name}>
            {t("social.communitySource", { name: community.data.name })}
          </span>
        )}
      </span>
    );
  }

  return (
    <>
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
              data-active={view === "hot" && !topic}
              aria-current={view === "hot" && !topic ? "page" : undefined}
            >
              {discoverTab}
            </Link>
          </nav>
          <div className={s.headerActions}>
            <Link
              href="/social?view=people"
              scroll={false}
              className={s.iconButton}
              data-active={view === "people"}
              aria-label={t("social.people")}
              title={t("social.people")}
            >
              <UserPlus />
            </Link>
            <SocialPublishButton />
          </div>
        </div>
      </header>
      <div className={s.feedToolbar}>
        <div className={s.feedContext}>{context}</div>
        {view !== "people" && (
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
        )}
      </div>
    </>
  );
}
