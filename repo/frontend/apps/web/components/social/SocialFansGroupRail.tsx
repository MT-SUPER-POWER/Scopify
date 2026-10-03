"use client";

import { LayoutGrid, Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type {
  SocialFansGroupRailItemProps,
  SocialFansGroupRailProps,
} from "@/types/components/social";

/**
 * 动态页乐迷团筛选导轨
 * 「全部」与各乐迷团使用同一种圆形形态，「全部」以已加入团头像拼贴表达“合集”，
 * 选中态统一为品牌色描边 + 主文字色名称，避免多重强调。
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
  const mosaic = groups.slice(0, 4);

  return (
    <div
      className="-mx-1 mb-2 flex scrollbar-none items-start gap-2 overflow-x-auto px-1 pb-3"
      role="tablist"
      aria-label={t("social.myFansGroups")}
    >
      <RailItem
        active={isAllActive}
        label={t("social.fansGroupAll")}
        onSelect={() => onSelectGroup(null)}
      >
        {mosaic.length >= 2 ? (
          <span className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-surface-sunken">
            {Array.from({ length: 4 }, (_, index) => {
              const group = mosaic[index];
              return group?.headAvatarUrl ? (
                <Image
                  key={group.fansGroupId}
                  src={`${group.headAvatarUrl}?param=48y48`}
                  alt=""
                  width={24}
                  height={24}
                  className="size-full object-cover"
                />
              ) : (
                <span key={index} className="size-full bg-surface-elevated" />
              );
            })}
          </span>
        ) : (
          <span className="flex size-full items-center justify-center bg-surface-sunken text-content-muted">
            <LayoutGrid className="size-5" />
          </span>
        )}
      </RailItem>

      {groups.map((group) => {
        const displayName = group.artistName || group.fansGroupName;
        const level = group.userLevel?.level;
        return (
          <RailItem
            key={group.fansGroupId}
            active={selectedGroupId === group.fansGroupId}
            label={displayName}
            title={`${displayName}${level ? ` · Lv.${level}` : ""}`}
            badge={level ? `Lv.${level}` : undefined}
            onSelect={() => onSelectGroup(group.fansGroupId)}
          >
            {group.headAvatarUrl ? (
              <Image
                src={`${group.headAvatarUrl}?param=96y96`}
                alt=""
                width={44}
                height={44}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center bg-surface-sunken text-content-muted">
                <Users className="size-5" />
              </span>
            )}
          </RailItem>
        );
      })}
    </div>
  );
}

function RailItem({
  active,
  label,
  title,
  badge,
  onSelect,
  children,
}: SocialFansGroupRailItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      title={title ?? label}
      className="group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        className={cn(
          "relative rounded-full border-2 p-0.5 transition-colors duration-200",
          active ? "border-brand" : "border-transparent group-hover:border-content-subtle/40",
        )}
      >
        <span className="block size-11 overflow-hidden rounded-full bg-surface-elevated">
          {children}
        </span>
        {badge && (
          <span className="absolute -right-1 -bottom-0.5 rounded-full bg-surface-elevated px-1 py-px text-[9px] leading-tight font-semibold text-content-muted shadow-sm">
            {badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          "max-w-full truncate text-xs transition-colors",
          active ? "font-semibold text-content" : "text-content-muted group-hover:text-content",
        )}
      >
        {label}
      </span>
    </button>
  );
}
