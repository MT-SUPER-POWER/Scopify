"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SidebarPlaylistLibraryProps } from "@/types/components/sidebar";
import { PersonalFmPlaylistItem } from "./PersonalFmPlaylistItem";
import { SidebarPlaylistLibraryContent } from "./SidebarPlaylistLibraryContent";

export function SidebarPlaylistLibrary({ isCollapsed }: SidebarPlaylistLibraryProps) {
  const { t } = useI18n();
  const isLoggedIn = useLoginStatus();
  return (
    <section
      className={cn("flex min-h-0 flex-1 flex-col", !isCollapsed && "border-t border-content/10")}
      aria-label={t("sidebar.group.playlists")}
    >
      {!isCollapsed && (
        <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2 text-xs font-bold text-content-subtle">
          <span>{t("sidebar.group.playlists")}</span>
        </div>
      )}
      <ScrollArea
        className="scrollbar-custom min-h-0 flex-1 px-2"
        viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
      >
        <div className={cn("w-full min-w-0 space-y-1", isCollapsed ? "pb-2" : "pb-4")}>
          {isLoggedIn && <PersonalFmPlaylistItem isCollapsed={isCollapsed} />}
          <SidebarPlaylistLibraryContent isCollapsed={isCollapsed} />
        </div>
      </ScrollArea>
    </section>
  );
}
