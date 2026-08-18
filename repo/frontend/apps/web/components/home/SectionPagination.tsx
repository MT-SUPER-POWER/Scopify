"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SectionPaginationProps } from "@/types/components/home";

export function SectionPagination({
  className,
  currentPage,
  onPageChange,
  pageCount,
}: SectionPaginationProps) {
  const { t } = useI18n();

  if (pageCount <= 1) return null;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        title={t("home.pagination.previous")}
        aria-label={t("home.pagination.previous")}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        className="text-content-muted hover:bg-content/10 hover:text-content flex size-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-25"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPageChange(index)}
            aria-current={currentPage === index ? "page" : undefined}
            className={cn(
              "flex size-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors",
              currentPage === index
                ? "bg-brand text-brand-foreground font-bold shadow-xs"
                : "text-content-muted hover:bg-content/10 hover:text-content",
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        title={t("home.pagination.next")}
        aria-label={t("home.pagination.next")}
        disabled={currentPage >= pageCount - 1}
        onClick={() => onPageChange(currentPage + 1)}
        className="text-content-muted hover:bg-content/10 hover:text-content flex size-7 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-25"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
