import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistHeaderSkeleton() {
  return (
    <div className="flex flex-col w-full mt-13">
      {/* 1. 头部信息区域 */}
      <div className="flex flex-row items-end gap-6 p-6 w-full">
        {/* 左侧：封面图 */}
        <Skeleton className="w-52 h-52 rounded-md shrink-0 shadow-lg" />

        {/* 右侧：文本信息 */}
        <div className="flex flex-col gap-3 w-full pb-2">
          <Skeleton className="w-32 h-6 rounded-sm" />
          <Skeleton className="w-3/5 h-16 rounded-md mt-2" />

          <div className="flex items-center gap-3 mt-4">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <Skeleton className="w-32 h-4 rounded-sm" />
            <Skeleton className="w-1.5 h-1.5 rounded-full" />
            <Skeleton className="w-48 h-4 rounded-sm" />
          </div>
        </div>
      </div>

      {/* 2. 控制栏区域 (新增) */}
      <div className="flex flex-row items-center justify-between px-6 py-4 w-full">
        {/* 左侧操作按钮组：播放、随机、下载、更多 */}
        <div className="flex items-center gap-6">
          {/* 播放按钮 (最大) */}
          <Skeleton className="w-14 h-14 rounded-full" />
          {/* 其他三个辅助图标 */}
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* 右侧视图控制组：搜索、列表展示 */}
        <div className="flex items-center gap-4">
          {/* 搜索图标位 */}
          <Skeleton className="w-5 h-5 rounded-full" />
          {/* List 文字及图标位 */}
          <Skeleton className="w-16 h-5 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
