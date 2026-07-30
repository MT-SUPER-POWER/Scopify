"use client";

import { Bookmark, Heart, History, Podcast } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

const libraryItems = [
  { href: "/liked", icon: Heart, labelKey: "sidebar.library.likedMusic" },
  { href: "/recent", icon: History, labelKey: "sidebar.library.recentPlayback" },
  { href: "/podcasts", icon: Podcast, labelKey: "sidebar.library.podcasts" },
  { href: "/collection", icon: Bookmark, labelKey: "sidebar.library.collection" },
] as const;

interface LibraryNavigationProps {
  isCollapsed: boolean;
}

export function LibraryNavigation({ isCollapsed }: LibraryNavigationProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  if (isCollapsed) {
    return (
      <nav
        className="mx-2 flex shrink-0 flex-col items-center gap-2 border-y border-white/5 py-3"
        aria-label={t("sidebar.library.title")}
      >
        {libraryItems.map((item) => {
          const isActive = pathname === item.href;
          const label = t(item.labelKey);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={`${t("sidebar.library.title")} - ${label}`}
              aria-label={`${t("sidebar.library.title")} - ${label}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex size-12 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex shrink-0 flex-col gap-1 px-3 py-4" aria-label={t("sidebar.library.title")}>
      <p className="px-2 pb-1 text-xs font-bold text-zinc-500">{t("sidebar.library.title")}</p>
      {libraryItems.map((item) => {
        const isActive = pathname === item.href;
        const label = t(item.labelKey);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? label : undefined}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-w-0 items-center rounded-md text-sm font-medium transition-colors",
              "gap-3 p-2",
              isActive
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
