"use client";

import { Bookmark, Cloud, History, Home, Podcast, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { LibraryNavigationProps } from "@/types/sidebar/components";

const sections = [
  {
    title: "social.browse",
    items: [
      { href: "/", icon: Home, labelKey: "social.home" },
      { href: "/social", icon: Users, labelKey: "social.title" },
    ],
  },
  {
    title: "sidebar.library.title",
    items: [
      { href: "/recent", icon: History, labelKey: "sidebar.library.recentPlayback" },
      { href: "/podcasts", icon: Podcast, labelKey: "sidebar.library.podcasts" },
      { href: "/collection", icon: Bookmark, labelKey: "sidebar.library.collection" },
      { href: "/cloud", icon: Cloud, labelKey: "sidebar.library.cloud" },
    ],
  },
] as const;

export function LibraryNavigation({ isCollapsed, headerAction }: LibraryNavigationProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav
      className={cn(
        "flex shrink-0 flex-col",
        isCollapsed ? "gap-2 px-2 py-3" : "gap-5 px-3 pt-3 pb-5",
      )}
      aria-label={t("social.browse")}
    >
      {sections.map((section, sectionIndex) => (
        <div
          key={section.title}
          className={cn("flex flex-col gap-1", isCollapsed && "items-center")}
        >
          {!isCollapsed && (
            <div className="flex h-6 items-center justify-between gap-2 pb-2 pl-2">
              <p className="text-xs font-medium text-content-subtle">{t(section.title)}</p>
              {sectionIndex === 0 && headerAction && (
                <div className="-my-2 text-muted-foreground">{headerAction}</div>
              )}
            </div>
          )}
          {section.items.map((item) => {
            const active =
              item.href === "/social"
                ? pathname.startsWith("/social") || pathname === "/profile"
                : pathname === item.href;
            const Icon = item.icon,
              label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                data-track-drop-blocked
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-colors",
                  isCollapsed
                    ? "size-12 justify-center"
                    : "min-w-0 gap-3 px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-content/10 text-content"
                    : "text-content-muted hover:bg-content/5 hover:text-content",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
