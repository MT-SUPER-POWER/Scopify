"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** The studio's shared title row, with optional document status and editing actions. */
export function FoliaStudioHeader({
  title,
  titleId,
  backLabel,
  onBack,
  metadata,
  actions,
}: {
  title: string;
  titleId?: string;
  backLabel: string;
  onBack: () => void;
  metadata?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 pr-4 pl-4 sm:pr-6">
      <button
        type="button"
        aria-label={backLabel}
        title={backLabel}
        onClick={onBack}
        className="st-t-fast grid size-8 shrink-0 place-items-center rounded-lg text-[color:var(--st-t2)] transition-colors hover:bg-[var(--st-fill)] hover:text-[color:var(--st-t1)]"
      >
        <ChevronLeft size={18} />
      </button>
      <h2
        id={titleId}
        className="shrink-0 text-xl leading-7 font-semibold text-[color:var(--st-t1)]"
      >
        {title}
      </h2>
      {metadata ? (
        <div className="sr-only min-w-0 flex-1 items-center gap-2 text-xs text-[color:var(--st-t2)] md:not-sr-only md:flex">
          {metadata}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
