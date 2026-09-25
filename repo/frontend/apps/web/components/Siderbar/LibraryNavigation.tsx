"use client";

import { Bookmark, History, Home, Podcast, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";

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
    ],
  },
] as const;

export function LibraryNavigation({ isCollapsed }: SidebarPlaylistLibraryProps) {
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
      {sections.map((section) => (
        <div
          key={section.title}
          className={cn("flex flex-col gap-1", isCollapsed && "items-center")}
        >
          {!isCollapsed && (
            <p className="px-2 pb-2 text-xs font-medium text-content-subtle">{t(section.title)}</p>
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
