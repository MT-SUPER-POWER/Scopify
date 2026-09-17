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
// 骨架屏子组件：模拟新歌单曲行
// ==========================================
export function SongItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <Skeleton className="size-12 shrink-0 rounded-md bg-skeleton" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-40 bg-skeleton" />
        <Skeleton className="h-3 w-28 bg-skeleton-subtle" />
      </div>
      <Skeleton className="h-3 w-10 bg-skeleton-subtle" />
    </div>
  );
}

// ==========================================
// 骨架屏子组件：模拟榜单卡片
// ==========================================
export function ToplistCardSkeleton() {
  return (
    <div className="flex h-95 flex-col justify-between rounded-2xl border border-content/10 bg-surface-elevated p-4 shadow-lg sm:h-100">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-lg bg-skeleton" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-28 bg-skeleton" />
          <Skeleton className="h-3.5 w-20 bg-skeleton-subtle" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-14 rounded bg-skeleton" />
          <Skeleton className="h-5 w-36 bg-skeleton" />
          <Skeleton className="h-3.5 w-24 bg-skeleton-subtle" />
        </div>
        <Skeleton className="size-11 shrink-0 rounded-full bg-skeleton sm:size-12" />
      </div>
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
        <div className="flex h-8 items-center">
          <Skeleton className="h-8 w-48 bg-skeleton" />
        </div>
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

      {/* 3. 艺人热门歌曲 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <div className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((id) => (
            <GridCardSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 4. 推荐歌手 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-32 bg-skeleton" />
        <div className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((id) => (
            <GridCardSkeleton key={id} isArtist />
          ))}
        </div>
      </section>

      {/* 5. 专辑 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <div className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => (
            <GridCardSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 6. 新歌速递 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <SongItemSkeleton key={id} />
          ))}
        </div>
      </section>

      {/* 7. 官方排行榜 Hero 大卡片 (压轴) */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((id) => (
            <ToplistCardSkeleton key={id} />
          ))}
        </div>
      </section>
    </div>
  );
}
