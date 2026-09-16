import { ArrowUpRight, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { UserVipBadge } from "@/components/shared/UserVipBadge";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { ProfileMenuIdentityProps } from "@/types/components/profileMenu";

export function ProfileMenuIdentity({ isLoggedIn, onLogin }: ProfileMenuIdentityProps) {
  const { t } = useI18n();
  const user = useUserStore((state) => state.user);
  const className =
    "group flex cursor-pointer items-center gap-5 rounded-none px-6 py-6 focus:bg-content/5";

  if (!isLoggedIn || !user || user.userId <= 0) {
    return (
      <DropdownMenuItem onSelect={onLogin} className={className}>
        <div className="flex size-18 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
          <User className="size-7" />
        </div>
        <div className="flex min-h-18 min-w-0 flex-1 flex-col justify-center gap-2">
          <span className="text-base font-semibold text-content">{t("common.action.login")}</span>
          <span className="text-xs leading-relaxed text-content-muted">
            {t("sidebar.card.loginSubtitle")}
          </span>
        </div>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild className={className}>
      <Link href={`/profile?userId=${user.userId}`}>
        {/*左侧头像部分*/}
        <div className="relative size-18 shrink-0 overflow-hidden rounded-full ring-1 ring-content/10">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.nickname || ""}
              fill
              sizes="72px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand text-2xl font-semibold text-brand-foreground">
              {user.nickname?.[0]?.toUpperCase() ?? "M"}
            </div>
          )}
        </div>
        {/*右侧个人信息部分*/}
        <div className="flex h-18 min-w-0 flex-1 flex-col justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="min-w-0 truncate text-base leading-none font-semibold text-content"
              title={user.nickname || undefined}
            >
              {user.nickname || t("profile.menu.profile")}
            </span>
            <UserVipBadge vipType={user.vipType} className="shrink-0" />
          </div>
          <span className="truncate text-sm text-content-muted" title={user.signature || undefined}>
            {user.signature}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-brand">
            {t("profile.menu.profile")}
            <ArrowUpRight className="size-3.5 text-brand" />
          </span>
        </div>
      </Link>
    </DropdownMenuItem>
  );
}
