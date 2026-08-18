"use client";

import React from "react";
import Link from "next/link";
import { FaCompactDisc } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { useSidebarNarrow } from "@/lib/hooks/useSidebarNarrow";
import { LibraryNavigation } from "./Siderbar/LibraryNavigation";
import { SiderBarMenuMemo } from "./Siderbar/SiderbarMenu";
import { SidebarPlaylistLibrary } from "./Siderbar/SidebarPlaylistLibrary";

function SidebarImpl() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isCollapsed = useSidebarNarrow(containerRef);

  return (
    <aside ref={containerRef} className="flex size-full min-h-0 flex-col bg-surface">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-sidebar">
        <header
          className={cn(
            "flex shrink-0 items-center px-3 py-4 text-muted-foreground",
            isCollapsed ? "justify-center px-2 py-3" : "justify-between",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex cursor-pointer items-center gap-3 overflow-hidden font-semibold text-foreground transition-colors hover:text-primary",
              isCollapsed && "gap-0",
            )}
          >
            <FaCompactDisc className={cn("size-6 shrink-0", isCollapsed && "size-8")} />
            {!isCollapsed && <span className="min-w-0 truncate text-[15px]">Scopify</span>}
          </Link>
          {!isCollapsed && <SiderBarMenuMemo />}
        </header>

        {isCollapsed && (
          <div className="flex shrink-0 justify-center px-2 pb-2">
            <SiderBarMenuMemo isCollapsed />
          </div>
        )}

        <LibraryNavigation isCollapsed={isCollapsed} />
        <SidebarPlaylistLibrary isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}

export const Sidebar = React.memo(SidebarImpl);
