"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { MvPlayer } from "./_components/MvPlayer";
import { useMvPage } from "../_components/MvPageProvider";
import { QueryPending } from "@/components/shared/QueryPending";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useMvDetailQuery } from "@/hooks/mv/useMVQueries";
import { useMvId, useMvRef } from "@/hooks/mv/useMvId";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/module/ui";

export default function MvPlayerSlot() {
  const smartRouter = useSmartRouter();
  const mvid = useMvId();
  const { isTheater, toggleTheater, nextId } = useMvPage();
  const detailQuery = useMvDetailQuery(useMvRef(), { boundary: true });
  const detail = detailQuery.data;
  const isPlayerBarHidden = useUiStore((state) => state.isPlayerBarHidden);
  const setIsPlayerBarHidden = useUiStore((state) => state.setIsPlayerBarHidden);
  const poster = detail?.coverUrl ?? "";

  // 详情加载期间占住播放器的位置，尺寸与播放器一致。
  if (detailQuery.isPending)
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
        {detailQuery.fetchStatus === "paused" ? (
          <QueryPending isPaused />
        ) : (
          <Skeleton className="size-full bg-skeleton" />
        )}
      </div>
    );
  return (
    <MvPlayer
      key={mvid}
      isTheater={isTheater}
      isPlayerBarHidden={isPlayerBarHidden}
      onTogglePlayerBar={() => setIsPlayerBarHidden(!isPlayerBarHidden)}
      onToggleTheater={toggleTheater}
      resolutions={detail?.qualities.map((quality) => quality.height) ?? []}
      poster={poster ? getSizedImageUrl(poster, 1280) : undefined}
      onNext={nextId ? () => void smartRouter.push(`/mv?id=${nextId}`) : undefined}
    />
  );
}
