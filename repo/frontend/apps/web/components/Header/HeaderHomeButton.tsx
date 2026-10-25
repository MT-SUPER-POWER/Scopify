"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiHouseBold, PiHouseFill } from "react-icons/pi";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

/** 搜索框左侧的圆形首页入口，位于首页时显示实心图标。 */
export function HeaderHomeButton() {
  const { t } = useI18n();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const label = t("social.home");

  return (
    <Link
      href="/"
      scroll={false}
      aria-label={label}
      title={label}
      aria-current={isHome ? "page" : undefined}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full transition-all",
        "bg-surface-sunken/80 hover:scale-105 hover:bg-surface-elevated",
        isHome ? "text-content" : "text-content-muted hover:text-content",
      )}
    >
      {isHome ? <PiHouseFill className="size-6" /> : <PiHouseBold className="size-6" />}
    </Link>
  );
}
