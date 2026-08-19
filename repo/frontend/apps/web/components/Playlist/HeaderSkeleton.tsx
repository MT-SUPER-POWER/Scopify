import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import type { PlaylistHeaderSkeletonProps } from "@/types/components/playlist";

export default function PlaylistHeaderSkeleton({
  showActions = true,
}: PlaylistHeaderSkeletonProps) {
  return (
    <div className="flex w-full flex-col">
      {/* 1. 头部信息区域 */}
      <div className="relative z-10 flex flex-col items-start gap-7 px-6 pt-24 pb-7 md:flex-row md:items-stretch md:gap-8 md:px-8 lg:px-10 xl:px-12">
        {/* 左侧：封面图 */}
        <Skeleton className="size-48 shrink-0 rounded-md bg-skeleton shadow-panel lg:size-56" />

        {/* 右侧：文本信息 */}
        <div className="flex min-w-0 flex-1 flex-col justify-end gap-3 pb-2 md:min-h-48 lg:min-h-56">
          <Skeleton className="h-6 w-24 rounded-sm bg-skeleton" />
          <Skeleton className="mb-2 h-14 w-3/5 rounded-md bg-skeleton lg:h-16" />

          <div className="flex items-center gap-3">
            <Skeleton className="size-7 shrink-0 rounded-full bg-skeleton" />
            <Skeleton className="h-4 w-28 rounded-sm bg-skeleton" />
            <Skeleton className="size-1.5 rounded-full bg-skeleton" />
            <Skeleton className="h-4 w-40 rounded-sm bg-skeleton" />
          </div>
        </div>
      </div>

      {showActions && (
        /* 2. 控制栏区域 */
        <div className="flex min-h-26 flex-wrap items-center justify-between gap-4 p-6 md:px-8 lg:px-10 xl:px-12">
          {/* 左侧操作按钮组：播放、评论、随机、下载、更多 */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {/* 播放按钮 */}
            <Skeleton className="size-14 rounded-full bg-skeleton" />
            {/* 辅助操作图标 */}
            <Skeleton className="size-8 rounded-full bg-skeleton" />
            <Skeleton className="size-8 rounded-full bg-skeleton" />
            <Skeleton className="size-8 rounded-full bg-skeleton" />
            <Skeleton className="size-8 rounded-full bg-skeleton" />
          </div>

          {/* 右侧视图控制组：搜索等 */}
          <div className="flex shrink-0 items-center gap-3">
            <Skeleton className="size-8 rounded-full bg-skeleton" />
          </div>
        </div>
      )}
    </div>
  );
}
