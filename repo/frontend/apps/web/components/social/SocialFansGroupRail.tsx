"use client";

import { Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { UserFansGroupItem } from "@/types/api/fansGroup";

/**
 * 动态页顶部乐迷团导航圈 Rail 组件
 * 提供类似社交圈子的横向头像导轨，支持“全部”聚合与单个艺人乐迷团切换
 */

export interface SocialFansGroupRailProps {
  groups: UserFansGroupItem[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
}

/**
 * 渲染乐迷团横向头像导轨
 * @param props - 包含乐迷团列表、选中团ID及切换回调
 */
export function SocialFansGroupRail({
  groups,
  selectedGroupId,
  onSelectGroup,
}: SocialFansGroupRailProps) {
  const { t } = useI18n();

  if (groups.length === 0) {
    return null;
  }

  const isAllActive = !selectedGroupId || selectedGroupId === "all";

  return (
    <div className="mb-4 w-full">
      <div
        className="flex scrollbar-none items-center gap-4 overflow-x-auto px-1 py-2"
        role="tablist"
        aria-label={t("social.myFansGroups")}
      >
        {/* 全部 / 综合圈子 */}
        <button
          type="button"
          role="tab"
          aria-selected={isAllActive}
          onClick={() => onSelectGroup(null)}
          className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
        >
          <div
            className={cn(
              "relative flex size-14 items-center justify-center rounded-full transition-all duration-200",
              "border border-brand/30 bg-gradient-to-br from-brand/20 to-brand/5 text-brand shadow-sm",
              "group-hover:scale-105 group-hover:border-brand/60",
              isAllActive && "ring-offset-surface-base ring-2 ring-brand ring-offset-2",
            )}
          >
            <Sparkles className="size-6 text-brand" />
          </div>
          <span
            className={cn(
              "max-w-16 truncate text-xs font-medium transition-colors",
              isAllActive
                ? "font-semibold text-brand"
                : "text-content-muted group-hover:text-content",
            )}
          >
            {t("social.fansGroupAll")}
          </span>
        </button>

        {/* 用户已加入的艺人乐迷团 */}
        {groups.map((group) => {
          const isActive = selectedGroupId === group.fansGroupId;
          const displayName = group.artistName || group.fansGroupName;
          const level = group.userLevel?.level;

          return (
            <button
              key={group.fansGroupId}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectGroup(group.fansGroupId)}
              className="group flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
              title={`${displayName}${level ? ` (Lv.${level})` : ""}`}
            >
              <div className="relative size-14 transition-all duration-200 group-hover:scale-105">
                <div
                  className={cn(
                    "border-surface-border size-full overflow-hidden rounded-full border bg-surface-elevated shadow-sm",
                    isActive && "ring-offset-surface-base ring-2 ring-brand ring-offset-2",
                  )}
                >
                  {group.headAvatarUrl ? (
                    <Image
                      src={`${group.headAvatarUrl}?param=120y120`}
                      alt={displayName}
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-surface-sunken text-content-muted">
                      <Users className="size-6" />
                    </div>
                  )}
                </div>
                {level && (
                  <span className="border-surface-base absolute -right-0.5 -bottom-0.5 z-10 flex items-center justify-center rounded-full border bg-brand px-1 py-0.5 text-[9px] leading-none font-bold text-brand-foreground shadow-sm">
                    Lv.{level}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "max-w-16 truncate text-xs font-medium transition-colors",
                  isActive
                    ? "font-semibold text-brand"
                    : "text-content-muted group-hover:text-content",
                )}
              >
                {displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
