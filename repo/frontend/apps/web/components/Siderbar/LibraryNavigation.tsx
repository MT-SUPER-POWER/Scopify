"use client";

import { Bookmark, Heart, History, Podcast } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";
import { useAppDragStore } from "@/store/module/appDrag";
import { useBatchSongLike } from "@/hooks/playlist/useBatchSongLike";
import { useTrackDropTarget } from "@/hooks/playlist/useTrackDropTarget";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";

const libraryItems = [
  { href: "/liked", icon: Heart, labelKey: "sidebar.library.likedMusic" },
  { href: "/recent", icon: History, labelKey: "sidebar.library.recentPlayback" },
  { href: "/podcasts", icon: Podcast, labelKey: "sidebar.library.podcasts" },
  { href: "/collection", icon: Bookmark, labelKey: "sidebar.library.collection" },
] as const;

export function LibraryNavigation({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { batchLike } = useBatchSongLike();
  const user = useUserStore((state) => state.user);
  const likedPlaylistId = useUserStore((state) => state.playlist.find((item) => item.specialType === 5)?.id);
  const sourceId = useAppDragStore((state) => state.sourcePlaylistId);
  const likedPending = useAppDragStore((state) => state.pendingTargetIds.includes("liked"));
  const drop = useTrackDropTarget({
    id: "liked-navigation",
    enabled: isRealUser(user) && !likedPending && sourceId !== String(likedPlaylistId),
    onDrop: (tracks) => batchLike(tracks, true),
  });

  return (
    <nav
      className={cn(
        "flex shrink-0 flex-col",
        isCollapsed ? "mx-2 items-center gap-2 border-y border-content/10 py-3" : "gap-1 px-3 py-4",
      )}
      aria-label={t("sidebar.library.title")}
    >
      {!isCollapsed && <p className="px-2 pb-1 text-xs font-bold text-content-subtle">{t("sidebar.library.title")}</p>}
      {libraryItems.map((item) => {
        const isActive = pathname === item.href;
        const isLiked = item.href === "/liked";
        const targeted = isLiked && drop.targeted;
        const label = t(item.labelKey);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            {...(isLiked ? drop.props : { "data-track-drop-blocked": true })}
            title={label}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex items-center rounded-md transition-colors",
              isCollapsed ? "size-12 justify-center" : "min-w-0 gap-3 p-2 text-sm font-medium",
              isActive ? "bg-content/10 text-content" : "text-content-muted hover:bg-content/5 hover:text-content",
              targeted && "bg-rose-500/15 text-rose-500 ring-2 ring-rose-500",
            )}
          >
            <Icon className={cn(isCollapsed ? "size-5" : "size-4 shrink-0", targeted && "fill-rose-500 text-rose-500")} />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
