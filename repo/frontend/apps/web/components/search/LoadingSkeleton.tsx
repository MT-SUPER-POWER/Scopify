import { cn } from "@/lib/utils";
import type { Category } from "@/types/search";

const CARD_COUNT = 6;

function SkeletonBlock({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-md bg-skeleton-subtle", className)} />;
}

function SectionHeadingSkeleton() {
  return (
    <div className="mb-4 flex items-end justify-between">
      <SkeletonBlock className="h-7 w-20" />
      <SkeletonBlock className="h-4 w-14" />
    </div>
  );
}

function ArtistGridSkeleton() {
  return (
    <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className="rounded-xl bg-surface-elevated p-4">
          <SkeletonBlock className="mx-auto aspect-square w-full rounded-full" />
          <SkeletonBlock className="mx-auto mt-4 h-5 w-3/5" />
          <SkeletonBlock className="mx-auto mt-2 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className="rounded-xl bg-surface-elevated p-4">
          <SkeletonBlock className="aspect-square w-full" />
          <SkeletonBlock className="mt-4 h-5 w-4/5" />
          <SkeletonBlock className="mt-2 h-4 w-3/5" />
        </div>
      ))}
    </div>
  );
}

export function MvGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex min-w-0 flex-col rounded-2xl bg-surface-elevated p-3">
          <SkeletonBlock className="aspect-video w-full rounded-xl" />
          <div className="mt-3 flex min-w-0 gap-3">
            <SkeletonBlock className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <SkeletonBlock className="h-4 w-4/5 rounded" />
              <SkeletonBlock className="h-3.5 w-1/2 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MvsViewSkeleton() {
  return (
    <div className="pb-10">
      <MvGridSkeleton count={6} />
    </div>
  );
}

export function SongsViewSkeleton() {
  return (
    <div className="space-y-2 pb-10">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-3 py-2.5">
          <SkeletonBlock className="h-4 w-6 shrink-0" />
          <SkeletonBlock className="size-10 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonBlock className="h-4 w-1/3 rounded" />
            <SkeletonBlock className="h-3 w-1/4 rounded" />
          </div>
          <SkeletonBlock className="hidden h-4 w-24 shrink-0 md:block" />
          <SkeletonBlock className="h-4 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function VoiceListSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-x-12 gap-y-5 lg:grid-cols-2">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className="flex items-center gap-3 p-1">
          <SkeletonBlock className="size-16 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div className="h-64 w-[40%] animate-pulse rounded-xl bg-skeleton-subtle" />
        <div className="w-[60%] space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-skeleton-subtle" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AllViewSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div className="mb-10 grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl bg-surface-elevated p-6 xl:col-span-5">
          <SkeletonBlock className="size-24" />
          <SkeletonBlock className="mt-6 h-8 w-2/5" />
          <SkeletonBlock className="mt-3 h-5 w-3/5" />
        </div>
        <div className="rounded-xl bg-surface-elevated p-5 xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBlock className="h-7 w-16" />
            <SkeletonBlock className="h-4 w-14" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-1">
                <SkeletonBlock className="size-10 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-2/5" />
                  <SkeletonBlock className="h-3 w-1/4" />
                </div>
                <SkeletonBlock className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mb-10">
        <SectionHeadingSkeleton />
        <ArtistGridSkeleton />
      </section>
      <section className="mb-10">
        <SectionHeadingSkeleton />
        <MvGridSkeleton count={3} />
      </section>
      <section className="mb-10">
        <SectionHeadingSkeleton />
        <CardGridSkeleton />
      </section>
      <section className="mb-10">
        <SectionHeadingSkeleton />
        <CardGridSkeleton />
      </section>
      <section className="mb-10">
        <SectionHeadingSkeleton />
        <CardGridSkeleton />
      </section>
      <section className="mb-10">
        <SectionHeadingSkeleton />
        <VoiceListSkeleton />
      </section>
    </div>
  );
}

export function CategorySkeleton({ category }: { category: Category }) {
  switch (category) {
    case "All":
      return <AllViewSkeleton />;
    case "MVs":
      return <MvsViewSkeleton />;
    case "Songs":
      return <SongsViewSkeleton />;
    case "Artists":
      return (
        <div className="pb-10">
          <ArtistGridSkeleton />
        </div>
      );
    case "Albums":
    case "Playlists":
    case "Podcasts":
      return (
        <div className="pb-10">
          <CardGridSkeleton />
        </div>
      );
    case "Voices":
      return (
        <div className="pb-10">
          <VoiceListSkeleton />
        </div>
      );
    default:
      return <LoadingSkeleton />;
  }
}
