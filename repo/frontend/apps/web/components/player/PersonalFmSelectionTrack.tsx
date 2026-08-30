"use client";

import type { ReactNode } from "react";

import { useHorizontalDragScroll } from "@/hooks/ui/useHorizontalDragScroll";
import { cn } from "@/lib/utils";

interface PersonalFmSelectionTrackProps {
  children: ReactNode;
}

export function PersonalFmSelectionTrack({ children }: PersonalFmSelectionTrackProps) {
  const { isDragging, scrollHandlers } = useHorizontalDragScroll();

  return (
    <div
      {...scrollHandlers}
      className={cn(
        "flex touch-pan-y [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden",
        isDragging ? "cursor-grabbing select-none" : "cursor-grab",
      )}
    >
      {children}
    </div>
  );
}
