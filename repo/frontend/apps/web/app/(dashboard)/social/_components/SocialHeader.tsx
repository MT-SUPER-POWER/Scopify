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
import { useTranslation } from "react-i18next";

import type { SocialHeaderProps } from "@/types/social/components";
import { SocialPublishButton } from "./SocialPublishButton";
import { cn } from "@/lib/utils";
import {
  socialIconButtonClass,
  socialTabClass,
  socialTabsClass,
} from "@/components/social/socialClasses";

/*
 * 磨砂底板常驻，滚动时只过渡 opacity（合成层动画，不触发布局/重建 backdrop 层），
 * 材质与时长对齐全局顶栏；左右与底部用 mask 淡出，不再是一块硬边灰板。
 * 底色与主面板同色（surface-raised = --card），吸顶时不出现一块颜色不同的灰板。
 */
const streamHeaderClass =
  "sticky top-0 z-10 before:pointer-events-none before:absolute before:inset-[0_-24px_-28px] before:-z-1 before:bg-card/88 before:backdrop-blur-[16px] before:[mask-image:linear-gradient(to_right,transparent,var(--foreground)_24px,var(--foreground)_calc(100%-24px),transparent),linear-gradient(var(--foreground)_calc(100%-28px),transparent)] before:[mask-composite:intersect] before:transition-opacity before:duration-300 before:ease-[ease] before:will-change-[opacity] data-[top=true]:before:opacity-0";
const streamToolbarClass =
  "flex min-h-14 items-stretch gap-7 @max-[500px]:gap-[18px] @max-[360px]:gap-3";
/** 页签靠字号与明暗区分，不画下划线 */
const streamTabClass = cn(
  socialTabClass,
  "px-0.5 py-0 text-[18px] font-bold tracking-[-0.02em] transition-[color] duration-200 ease-[ease] hover:text-foreground",
);
const contextHoverClass = "hover:text-foreground";

/**
 * 动态页头部：标签与操作合并为一行吸顶（标题仅供读屏，侧栏已标明当前位置）。
 * 只有返回链接或选中乐迷团这类需要说明的场景，才在下方显示随内容滚走的上下文行。
 */
export function SocialHeader({ view, groupId, groups }: SocialHeaderProps) {
  const { t } = useTranslation();
  const isAtTop = useIsScrollAtTop();
  const { uid, account } = useSocialAccount();
  const client = useQueryClient();
  const hasGroups = groups.length > 0;
  const discoverTab = t(hasGroups ? "social.fansGroupTab" : "social.squareTab");
  const selectedGroup = groups.find((group) => group.fansGroupId === groupId);
  const community = useSocialGroup(view === "hot" && !hasGroups ? groupId : "");
  const queryKey =
    view === "people"
      ? socialKey(account, "people")
      : view === "friends"
        ? socialKey(account, "events", "home")
        : groupId === "all"
          ? socialKey(account, "events", "community", "aggregated")
          : socialKey(account, "events", "community", groupId);
  const refreshing = useIsFetching({ queryKey }) > 0;

  let context: ReactNode = null;
  if (view === "people") {
    context = (
      <Link
        href="/social"
        scroll={false}
        className={cn("inline-flex items-center gap-1.5 font-semibold", contextHoverClass)}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("social.backToFeed")}
      </Link>
    );
  } else if (view === "hot" && selectedGroup) {
    const level = selectedGroup.userLevel?.level;
    context = (
      <span className="flex min-w-0 items-center gap-2">
        {selectedGroup.headAvatarUrl && (
          <Image
            src={`${selectedGroup.headAvatarUrl}?param=48y48`}
            alt=""
            width={20}
            height={20}
            className="size-5 rounded-full object-cover"
          />
        )}
        <strong title={selectedGroup.fansGroupName} className="truncate font-[650] text-foreground">
          {selectedGroup.fansGroupName}
        </strong>
        {level ? (
          <span className="shrink-0 rounded-full bg-secondary px-1.5 py-px text-[10px] font-bold text-muted-foreground">
            Lv.{level}
          </span>
        ) : null}
        <Link
          href={`/artist?id=${selectedGroup.headId}`}
          className={cn(
            "ml-1 inline-flex shrink-0 items-center gap-px text-[12px]",
            contextHoverClass,
          )}
          title={t("social.viewArtist")}
        >
          {t("social.viewArtist")}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      </span>
    );
  } else if (view === "hot" && !hasGroups) {
    context = (
      <span className="flex min-w-0 items-center gap-2">
        <span>{t("social.squareContext")}</span>
        {community.data && (
          <span className="truncate text-[11px] text-muted-foreground" title={community.data.name}>
            {t("social.communitySource", { name: community.data.name })}
          </span>
        )}
      </span>
    );
  }

  // 未登录时标签、发布、找人与刷新都不可用，只保留标题
  if (!uid) {
    return (
      <header className={streamHeaderClass} data-top={isAtTop}>
        <div className={streamToolbarClass}>
          <h1 className="self-center text-[24px] font-[750] tracking-[-0.04em] @max-[500px]:text-[21px]">
            {t("social.title")}
          </h1>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className={streamHeaderClass} data-top={isAtTop}>
        <div className={streamToolbarClass}>
          <h1 className="sr-only">{t("social.title")}</h1>
          <nav
            className={cn(socialTabsClass, "min-h-0 gap-6 @max-[500px]:gap-[18px]")}
            aria-label={t("social.title")}
          >
            <Link
              href="/social?view=following"
              scroll={false}
              className={streamTabClass}
              data-active={view === "friends"}
              aria-current={view === "friends" ? "page" : undefined}
            >
              {t("social.followingTab")}
            </Link>
            <Link
              href="/social"
              scroll={false}
              className={streamTabClass}
              data-active={view === "hot"}
              aria-current={view === "hot" ? "page" : undefined}
            >
              {discoverTab}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {view !== "people" && (
              <button
                type="button"
                className={socialIconButtonClass}
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
              className={cn(
                socialIconButtonClass,
                "data-[active=true]:bg-secondary data-[active=true]:text-foreground",
              )}
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
        <div className="flex min-h-13 items-center justify-between gap-3 text-[13px] text-muted-foreground">
          <div className="min-w-0 flex-1 @max-[500px]:text-[12px]">{context}</div>
        </div>
      )}
    </>
  );
}
