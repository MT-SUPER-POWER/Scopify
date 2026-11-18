"use client";

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import type { HomeCardSkeletonGridProps } from "@/types/home/components";
import { cn } from "@/lib/utils";

export function HomeCardSkeletonGrid({ isArtist = false }: HomeCardSkeletonGridProps) {
  return (
    <div
      aria-hidden
      className="grid w-full min-w-0 auto-rows-0 grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] grid-rows-[auto] gap-x-2 overflow-hidden"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="min-w-0 p-2">
          <Skeleton
            className={cn(
              "mb-3 aspect-square w-full bg-skeleton-subtle",
              isArtist && "rounded-full",
            )}
          />
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-3/4 bg-skeleton-subtle" />
          </div>
          {!isArtist && (
            <div className="mt-1 flex h-4 items-center">
              <Skeleton className="h-3 w-1/2 bg-skeleton-subtle" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HomeShortcutSkeletonGrid() {
  return (
    <div
      aria-hidden
      className="grid max-h-39 w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-3 overflow-hidden"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex h-18 items-center gap-4 overflow-hidden rounded-md bg-content/10 pr-4"
        >
          <Skeleton className="size-18 shrink-0 rounded-none bg-skeleton" />
          <Skeleton className="h-3.5 w-32 min-w-0 bg-skeleton" />
        </div>
      ))}
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
    <div className="relative z-10 mx-auto w-full max-w-400 animate-in space-y-7 px-4 py-6 duration-500 fade-in sm:px-6">
      {/* 1. 欢迎语 + 快速访问 */}
      <section className="space-y-4">
        <div className="flex h-8 items-center">
          <Skeleton className="h-8 w-48 bg-skeleton" />
        </div>
        <HomeShortcutSkeletonGrid />
      </section>

      {/* 2. 推荐歌单 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-64 bg-skeleton" />
        <HomeCardSkeletonGrid />
      </section>

      {/* 3. 艺人热门歌曲 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <HomeCardSkeletonGrid />
      </section>

      {/* 4. 推荐歌手 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-32 bg-skeleton" />
        <HomeCardSkeletonGrid isArtist />
      </section>

      {/* 5. 专辑 */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-44 bg-skeleton" />
        <HomeCardSkeletonGrid />
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
