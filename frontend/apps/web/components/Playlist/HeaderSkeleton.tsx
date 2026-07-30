import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistHeaderSkeleton() {
  return (
    <div className="mt-13 flex w-full flex-col">
      {/* 1. 头部信息区域 */}
      <div className="flex w-full flex-row items-end gap-6 p-6">
        {/* 左侧：封面图 */}
        <Skeleton className="size-52 shrink-0 rounded-md shadow-lg" />

        {/* 右侧：文本信息 */}
        <div className="flex w-full flex-col gap-3 pb-2">
          <Skeleton className="h-6 w-32 rounded-sm" />
          <Skeleton className="mt-2 h-16 w-3/5 rounded-md" />

          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-sm" />
            <Skeleton className="size-1.5 rounded-full" />
            <Skeleton className="h-4 w-48 rounded-sm" />
          </div>
        </div>
      </div>

      {/* 2. 控制栏区域 (新增) */}
      <div className="flex w-full flex-row items-center justify-between px-6 py-4">
        {/* 左侧操作按钮组：播放、随机、下载、更多 */}
        <div className="flex items-center gap-6">
          {/* 播放按钮 (最大) */}
          <Skeleton className="size-14 rounded-full" />
          {/* 其他三个辅助图标 */}
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>

        {/* 右侧视图控制组：搜索、列表展示 */}
        <div className="flex items-center gap-4">
          {/* 搜索图标位 */}
          <Skeleton className="size-5 rounded-full" />
          {/* List 文字及图标位 */}
          <Skeleton className="h-5 w-16 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
