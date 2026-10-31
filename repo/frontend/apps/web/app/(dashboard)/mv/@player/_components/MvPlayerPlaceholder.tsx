import { QueryPending } from "@/components/shared/QueryPending";
import { cn } from "@/lib/utils";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

interface MvPlayerPlaceholderProps {
  isTheater: boolean;
  isPlayerBarHidden: boolean;
  isPaused: boolean;
}

/** 详情加载期间占住播放器的位置，尺寸与播放器一致。 */
export function MvPlayerPlaceholder({
  isTheater,
  isPlayerBarHidden,
  isPaused,
}: MvPlayerPlaceholderProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl",
        isTheater
          ? isPlayerBarHidden
            ? "h-[min(82dvh,calc(100dvh-8rem))] min-h-64 w-full"
            : "h-[min(75dvh,calc(100dvh-8rem))] min-h-64 w-full"
          : "aspect-video w-full",
      )}
    >
      {isPaused ? <QueryPending isPaused /> : <Skeleton className="size-full bg-skeleton" />}
    </div>
  );
}
