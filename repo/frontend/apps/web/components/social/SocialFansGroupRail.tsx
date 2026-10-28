"use client";

import { Users } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type {
  SocialFansGroupRailItemProps,
  SocialFansGroupRailProps,
} from "@/types/social/components";

/**
 * 动态页乐迷团筛选：一行可横向滚动的胶囊。
 * 「全部」为纯文字胶囊，各乐迷团为「小头像 + 名称」；选中态反色填充，
 * 等级等次要信息收进悬停提示，避免角标和截断名称把一行挤乱。
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
    <div
      className="-mx-1 flex scrollbar-none items-center gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] px-1 pt-4 pb-3"
      role="tablist"
      aria-label={t("social.myFansGroups")}
    >
      <RailItem
        active={isAllActive}
        label={t("social.fansGroupAll")}
        onSelect={() => onSelectGroup(null)}
      />

      {groups.map((group) => {
        const displayName = group.artistName || group.fansGroupName;
        const level = group.userLevel?.level;
        return (
          <RailItem
            key={group.fansGroupId}
            active={selectedGroupId === group.fansGroupId}
            label={displayName}
            title={`${group.fansGroupName}${level ? ` · Lv.${level}` : ""}`}
            onSelect={() => onSelectGroup(group.fansGroupId)}
          >
            {group.headAvatarUrl ? (
              <Image
                src={`${group.headAvatarUrl}?param=48y48`}
                alt=""
                width={20}
                height={20}
                className="size-full object-cover"
              />
            ) : (
              <Users className="size-3" />
            )}
          </RailItem>
        );
      })}
    </div>
  );
}

function RailItem({ active, label, title, onSelect, children }: SocialFansGroupRailItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      title={title ?? label}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-full border text-[13px] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        children ? "pr-3 pl-1.5" : "px-3.5",
        active
          ? "border-transparent bg-content font-semibold text-surface"
          : "border-content-subtle/20 text-content-muted hover:border-content-subtle/40 hover:text-content",
      )}
    >
      {children && (
        <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken text-content-muted">
          {children}
        </span>
      )}
      <span className="max-w-[10em] truncate">{label}</span>
    </button>
  );
}
