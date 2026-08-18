import { cn } from "@/lib/utils";

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
