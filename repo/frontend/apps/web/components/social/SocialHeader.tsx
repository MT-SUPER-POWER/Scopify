"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, RefreshCw, UserPlus } from "lucide-react";
import Image from "next/image";
import { useIsScrollAtTop } from "@/components/shared/NavigationScrollProvider";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialGroup } from "@/hooks/social/useSocialNotes";
import { socialKey } from "@/lib/social/cache";
import { useI18n } from "@/store/module/i18n";
import type { SocialHeaderProps } from "@/types/components/social";
import { SocialPublishButton } from "./SocialPublishButton";
import s from "./Social.module.css";

/**
 * 动态页头部：标签与操作合并为一行吸顶（标题仅供读屏，侧栏已标明当前位置）。
 * 只有返回链接或选中乐迷团这类需要说明的场景，才在下方显示随内容滚走的上下文行。
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
          : view === "topics"
            ? socialKey(account, "topics")
            : groupId === "all"
              ? socialKey(account, "events", "community", "aggregated")
              : socialKey(account, "events", "community", groupId);
  const refreshing = useIsFetching({ queryKey }) > 0;

  let context: ReactNode = null;
  if (view === "people" || topic) {
    context = (
      <Link
        href={topic ? "/social?view=topics" : "/social"}
        scroll={false}
        className={s.contextBack}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {view === "people"
          ? t("social.backToFeed")
          : t("social.backTo", { name: t("social.hotTopics") })}
      </Link>
    );
  } else if (view === "hot" && selectedGroup) {
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
  } else if (view === "hot" && !hasGroups) {
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

  // 未登录时标签、发布、找人与刷新都不可用，只保留标题
  if (!uid) {
    return (
      <header className={s.streamHeader} data-top={isAtTop}>
        <div className={s.streamToolbar}>
          <h1 className={s.streamTitle}>{t("social.title")}</h1>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={s.streamHeader} data-top={isAtTop}>
        <div className={s.streamToolbar}>
          <h1 className="sr-only">{t("social.title")}</h1>
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
              {discoverTab}
            </Link>
            <Link
              href="/social?view=topics"
              scroll={false}
              className={s.tab}
              data-active={view === "topics"}
              aria-current={view === "topics" && !topic ? "page" : undefined}
            >
              {t("social.hotTopics")}
            </Link>
          </nav>
          <div className={s.headerActions}>
            {view !== "people" && (
              <button
                type="button"
                className={s.iconButton}
                disabled={refreshing}
                aria-label={t("social.refresh")}
                title={t("social.refresh")}
                onClick={() => void client.invalidateQueries({ queryKey })}
              >
                <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden="true" />
              </button>
            )}
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
      {context && (
        <div className={s.feedToolbar}>
          <div className={s.feedContext}>{context}</div>
        </div>
      )}
    </>
  );
}
