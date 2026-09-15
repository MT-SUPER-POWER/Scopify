import type { DragThumbnailProps } from "@/types/sortableList";

export function DragThumbnail({ cover, title, subtitle }: DragThumbnailProps) {
  return (
    <div className="flex h-11 w-50 items-center gap-2 p-1.5">
      <img src={cover} alt="" draggable={false} className="size-8 shrink-0 rounded object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        {subtitle && <p className="truncate text-[10px] text-content-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
