"use client";

import React from "react";
import Link from "next/link";
import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSidebarNarrow } from "@/lib/hooks/useSidebarNarrow";
import { LibraryNavigation } from "./LibraryNavigation";
import { SiderBarMenuMemo } from "./SiderbarMenu";
import { SidebarPlaylistLibrary } from "./SidebarPlaylistLibrary";

function SidebarImpl() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isCollapsed = useSidebarNarrow(containerRef);

  return (
    <aside ref={containerRef} className="@container/sidebar flex size-full min-h-0 flex-col bg-surface">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-sidebar">
        <header
          className={cn(
            "flex h-16 shrink-0 items-center gap-2 px-2 text-muted-foreground @min-[208px]/sidebar:px-3 @min-[240px]/sidebar:px-4",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <Link
            href="/"
            aria-label="Scopify"
            title="Scopify"
            className={cn(
              "flex min-w-0 items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
              isCollapsed && "justify-center",
            )}
          >
            <ScopifyBrand
              priority
              className="min-w-0"
              iconClassName={isCollapsed ? "size-9" : "size-8"}
              wordmarkClassName="hidden @min-[208px]/sidebar:block"
            />
          </Link>
          {!isCollapsed && <SiderBarMenuMemo />}
        </header>

        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
        >
          <LibraryNavigation isCollapsed={isCollapsed} />
          <SidebarPlaylistLibrary isCollapsed={isCollapsed} />
        </ScrollArea>
        {isCollapsed && (
          <footer className="flex h-14 shrink-0 items-center justify-center border-t border-content/5 px-2">
            <SiderBarMenuMemo isCollapsed />
          </footer>
        )}
      </div>
    </aside>
  );
}

export const Sidebar = React.memo(SidebarImpl);
export default Sidebar;
