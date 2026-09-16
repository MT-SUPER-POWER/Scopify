"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import type { GridCardSkeletonProps } from "@/types/components/home";
import { cn } from "@/lib/utils";

// ==========================================
// 骨架屏子组件：模拟 GridCard
// ==========================================
export function GridCardSkeleton({ isArtist = false }: GridCardSkeletonProps) {
  return (
    <div className="group flex flex-col gap-3 p-2">
      {/* 封面区域 */}
      <Skeleton
        className={cn(
          "aspect-square w-full bg-skeleton-subtle",
          isArtist ? "rounded-full" : "rounded-md",
        )}
      />
      {/* 文本区域 */}
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4 bg-skeleton-subtle" />
        {!isArtist && <Skeleton className="h-3 w-1/2 bg-skeleton-subtle" />}
      </div>
    </div>
  );
}

// ==========================================
// 骨架屏子组件：模拟 Banner/快捷访问块
// ==========================================
export function BannerItemSkeleton() {
  return (
    <div className="relative flex h-16 items-center overflow-hidden rounded-md bg-skeleton-subtle pr-4">
      <Skeleton className="size-16 shrink-0 rounded-none bg-skeleton" />
      <Skeleton className="ml-4 h-4 w-32 bg-skeleton" />
    </div>
  );
}

// ==========================================
// 整个页面的 Loading 龙骨
// ==========================================
export function HomePageSkeleton() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-400 animate-in space-y-7 px-4 pt-20 pb-6 duration-500 fade-in sm:px-6">
      {/* 1. 欢迎语 + 快速访问 */}
      <section className="space-y-4">
        {/* 标题模拟 */}
        <div className="flex h-8 items-center">
          <Skeleton className="h-8 w-48 bg-skeleton" />
        </div>
        {/* Banner 网格模拟 */}
        <div className="grid max-h-35 w-full min-w-0 auto-rows-[64px] grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
            <BannerItemSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 2. 推荐歌单 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-64 bg-skeleton" />
        <div className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
            <GridCardSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 3. 推荐歌手 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-32 bg-skeleton" />
        <div className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((id) => (
            <GridCardSkeleton key={id} isArtist />
          ))}
        </div>
      </section>
    </div>
  );
}
