"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ==========================================
// 骨架屏子组件：模拟 GridCard
// ==========================================
export function GridCardSkeleton({ isArtist = false }: { isArtist?: boolean }) {
  return (
    <div className="group flex flex-col gap-3">
      {/* 封面区域 */}
      <Skeleton
        className={cn("aspect-square w-full bg-white/5", isArtist ? "rounded-full" : "rounded-md")}
      />
      {/* 文本区域 */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        {!isArtist && <Skeleton className="h-3 w-1/2 bg-white/5" />}
      </div>
    </div>
  );
}

// ==========================================
// 骨架屏子组件：模拟 Banner/快捷访问块
// ==========================================
export function BannerItemSkeleton() {
  return (
    <div className="relative flex h-16 items-center overflow-hidden rounded-md bg-white/5 pr-4">
      <Skeleton className="size-16 shrink-0 rounded-none bg-white/10" />
      <Skeleton className="ml-4 h-4 w-32 bg-white/10" />
    </div>
  );
}

// ==========================================
// 整个页面的 Loading 龙骨
// ==========================================
export function HomePageSkeleton() {
  return (
    <div className="animate-in fade-in relative z-10 space-y-8 p-6 pt-20 duration-500">
      {/* 1. 欢迎语 + 快速访问 */}
      <section className="space-y-4">
        {/* 标题模拟 */}
        <div className="flex h-9 items-center gap-4">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="size-8 rounded-full bg-white/10" />
        </div>
        {/* Banner 网格模拟 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <BannerItemSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 2. 推荐歌单 */}
      <section className="mt-8 space-y-4">
        <Skeleton className="h-8 w-64 bg-white/10" />
        <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
            <GridCardSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 3. 推荐歌手 */}
      <section className="mt-8 space-y-4">
        <Skeleton className="h-8 w-32 bg-white/10" />
        <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((id) => (
            <GridCardSkeleton key={id} isArtist />
          ))}
        </div>
      </section>
    </div>
  );
}
