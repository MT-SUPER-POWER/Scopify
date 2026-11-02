import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { MvSimilarSkeletonProps } from "@/types/mv/components";

export function MvSimilarSkeleton({ isTheater = false }: MvSimilarSkeletonProps) {
  const { t } = useTranslation();
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
