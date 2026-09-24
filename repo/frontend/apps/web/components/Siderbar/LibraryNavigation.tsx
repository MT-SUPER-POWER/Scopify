"use client";

import { Bookmark, History, Podcast, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";

const libraryItems = [
  { href: "/recent", icon: History, labelKey: "sidebar.library.recentPlayback" },
  { href: "/podcasts", icon: Podcast, labelKey: "sidebar.library.podcasts" },
  { href: "/collection", icon: Bookmark, labelKey: "sidebar.library.collection" },
] as const;

export function LibraryNavigation({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className={cn(
        "flex shrink-0 flex-col",
        isCollapsed ? "mx-2 items-center gap-2 border-y border-content/10 py-3" : "gap-1 px-3 py-4",
      )}
      aria-label={t("sidebar.library.title")}
    >
      <Link
        href="/social"
        scroll={false}
        data-track-drop-blocked
        title={t("social.title")}
        aria-label={t("social.title")}
        aria-current={
          pathname === "/profile" || pathname.startsWith("/social") ? "page" : undefined
        }
        className={cn(
          "relative mb-3 flex items-center rounded-md transition-colors",
          isCollapsed ? "size-12 justify-center" : "min-w-0 gap-3 px-2 py-3 text-sm font-semibold",
          pathname === "/profile" || pathname.startsWith("/social")
            ? "bg-content/10 text-brand before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand"
            : "text-content-muted hover:bg-content/5 hover:text-content",
        )}
      >
        <Users className={cn(isCollapsed ? "size-5" : "size-4 shrink-0")} />
        {!isCollapsed && <span>{t("social.title")}</span>}
      </Link>
      {!isCollapsed && (
        <p className="px-2 pb-1 text-xs font-bold text-content-subtle">
          {t("sidebar.library.title")}
        </p>
      )}
      {libraryItems.map((item) => {
        const isActive = pathname === item.href;
        const label = t(item.labelKey);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-track-drop-blocked
            title={label}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center rounded-md transition-colors",
              isCollapsed ? "size-12 justify-center" : "min-w-0 gap-3 p-2 text-sm font-medium",
              isActive
                ? "bg-content/10 text-brand"
                : "text-content-muted hover:bg-content/5 hover:text-content",
            )}
          >
            <Icon className={cn(isCollapsed ? "size-5" : "size-4 shrink-0")} />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
