"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarNarrow } from "@/lib/hooks/useSidebarNarrow";
import { LibraryNavigation } from "./LibraryNavigation";
import { SiderBarMenuMemo } from "./SiderbarMenu";
import { SidebarPlaylistLibrary } from "./SidebarPlaylistLibrary";

function SidebarImpl() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isCollapsed = useSidebarNarrow(containerRef);

  return (
    <aside
      ref={containerRef}
      className="@container/sidebar flex size-full min-h-0 flex-col bg-surface"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-sidebar">
        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
        >
          <LibraryNavigation
            isCollapsed={isCollapsed}
            headerAction={!isCollapsed && <SiderBarMenuMemo />}
          />
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
