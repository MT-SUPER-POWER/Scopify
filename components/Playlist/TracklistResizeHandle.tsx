"use client";

import { GripVertical } from "lucide-react";
import type { MouseEventHandler, PointerEventHandler } from "react";

import { cn } from "@/lib/utils";

interface TracklistResizeHandleProps {
  active: boolean;
  onDoubleClick: MouseEventHandler<HTMLSpanElement>;
  onPointerDown: PointerEventHandler<HTMLSpanElement>;
}

export function TracklistResizeHandle({
  active,
  onDoubleClick,
  onPointerDown,
}: TracklistResizeHandleProps) {
  return (
    <span
      aria-hidden
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute inset-y-0 right-0 z-10 flex w-2 translate-x-1/2 cursor-col-resize touch-none items-center justify-center opacity-0 select-none group-hover/head:opacity-100",
        active && "opacity-100",
      )}
    >
      <GripVertical className={cn("size-3 text-zinc-500", active && "text-white")} />
    </span>
  );
}
