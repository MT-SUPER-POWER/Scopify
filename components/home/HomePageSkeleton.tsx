"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ==========================================
// 骨架屏子组件：模拟 GridCard
// ==========================================
export function GridCardSkeleton({ isArtist = false }: { isArtist?: boolean }) {
  return (
    <div className="flex flex-col gap-3 group">
      {/* 封面区域 */}
      <Skeleton
        className={cn("w-full aspect-square bg-white/5", isArtist ? "rounded-full" : "rounded-md")}
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
    <div className="flex items-center h-16 bg-white/5 rounded-md overflow-hidden relative pr-4">
      <Skeleton className="h-16 w-16 rounded-none bg-white/10 shrink-0" />
      <Skeleton className="h-4 w-32 ml-4 bg-white/10" />
    </div>
  );
}

// ==========================================
// 整个页面的 Loading 龙骨
// ==========================================
export function HomePageSkeleton() {
  return (
    <div className="relative z-10 p-6 pt-20 space-y-8 animate-in fade-in duration-500">
      {/* 1. 欢迎语 + 快速访问 */}
      <section className="space-y-4">
        {/* 标题模拟 */}
        <div className="flex items-center gap-4 h-9">
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </div>
        {/* Banner 网格模拟 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BannerItemSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* 2. 推荐歌单 */}
      <section className="space-y-4 mt-8">
        <Skeleton className="h-8 w-64 bg-white/10" />
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* 3. 推荐歌手 */}
      <section className="space-y-4 mt-8">
        <Skeleton className="h-8 w-32 bg-white/10" />
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <GridCardSkeleton key={i} isArtist />
          ))}
        </div>
      </section>
    </div>
  );
}
