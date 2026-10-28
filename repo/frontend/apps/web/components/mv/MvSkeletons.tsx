import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { useI18n } from "@/store/module/i18n";
import { cn } from "@/lib/utils";
import type { MvSimilarSkeletonProps } from "@/types/mv/components";

export function MvInfoSkeleton() {
  return (
    <div aria-hidden className="mt-4">
      <Skeleton className="h-7 w-2/3 bg-skeleton" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full bg-skeleton" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-skeleton" />
            <Skeleton className="h-3 w-20 bg-skeleton" />
          </div>
          <Skeleton className="h-9 w-16 rounded-full bg-skeleton" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
          <Skeleton className="h-9 w-20 rounded-full bg-skeleton" />
        </div>
      </div>
      <Skeleton className="mt-4 h-20 w-full rounded-xl bg-skeleton" />
    </div>
  );
}

export function MvSimilarSkeleton({ isTheater = false }: MvSimilarSkeletonProps) {
  const { t } = useI18n();
  return (
    <div>
      <h2 className="mb-2 text-base font-bold">{t("mv.section.similar")}</h2>
      <div aria-hidden className="-mx-1 flex flex-col gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-start gap-2 p-1">
            <Skeleton
              className={cn(
                "aspect-video w-42 shrink-0 rounded-lg bg-skeleton",
                isTheater && "xl:w-[60%]",
              )}
            />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-full bg-skeleton" />
              <Skeleton className="h-3 w-2/3 bg-skeleton" />
              <Skeleton className="h-3 w-1/2 bg-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
