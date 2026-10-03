"use client";

import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUserFansGroupsQuery } from "@/hooks/fansGroup/useFansGroupQueries";
import { useI18n } from "@/store/module/i18n";

/**
 * 个人主页“关于”标签下的乐迷团网格组件
 * 复用网格卡片规范，展示当前登录用户加入的全部歌手乐迷团
 */

/**
 * 渲染用户已加入的乐迷团网格列表
 */
export function ProfileFansGroupGrid() {
  const { t } = useI18n();
  const query = useUserFansGroupsQuery();
  const groups = query.data ?? [];

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-content">{t("social.myFansGroups")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse flex-col items-center rounded-xl bg-surface-elevated p-4"
            >
              <div className="mb-3 size-24 rounded-full bg-surface-sunken" />
              <div className="mb-1.5 h-4 w-16 rounded bg-surface-sunken" />
              <div className="h-3 w-12 rounded bg-surface-sunken" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-bold text-content">{t("social.myFansGroups")}</h2>
        <p className="text-sm text-content-muted">{t("social.noFansGroups")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-content">{t("social.myFansGroups")}</h2>
        <span className="text-xs text-content-muted">
          {t("social.fansGroupMembers", { count: groups.length })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {groups.map((group) => {
          const displayName = group.artistName || group.fansGroupName;
          const level = group.userLevel?.level;

          return (
            <Link
              key={group.fansGroupId}
              href={`/social?group=${group.fansGroupId}`}
              className="group flex cursor-pointer flex-col items-center rounded-xl bg-surface-elevated p-4 text-center transition-all duration-300 hover:bg-surface-overlay hover:shadow-card"
            >
              <div className="border-surface-border relative mb-3 size-24 overflow-hidden rounded-full border-2 shadow-panel transition-transform duration-300 group-hover:scale-105">
                {group.headAvatarUrl ? (
                  <Image
                    src={`${group.headAvatarUrl}?param=200y200`}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-surface-sunken text-content-subtle">
                    <Users className="size-8 opacity-40" />
                  </div>
                )}
                {level && (
                  <div className="absolute right-1 bottom-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground shadow-sm">
                    Lv.{level}
                  </div>
                )}
              </div>

              <h3
                className="mb-1 w-full truncate text-sm font-bold text-content"
                title={displayName}
              >
                {displayName}
              </h3>
              {group.totalMembersCount ? (
                <p className="w-full truncate text-xs text-content-muted">
                  {t("social.fansGroupMembers", { count: group.totalMembersCount })}
                </p>
              ) : group.fansGroupName ? (
                <p className="w-full truncate text-xs text-content-muted">{group.fansGroupName}</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
