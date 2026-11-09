"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { GridCard } from "@/components/home/GridCard";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface CollectionShelfItem {
  id: string;
  title: string;
  coverUrl: string;
  subtitle?: string;
  href?: string;
  isArtist?: boolean;
  onPlay?: (event: React.MouseEvent) => void;
  isLoading?: boolean;
}

/** Cards shown before the shelf is opened. */
const COLLAPSED_COUNT = 6;

/** One kind of saved thing as a titled shelf of cards that opens to show them all. */
export function CollectionShelf({
  title,
  items,
}: {
  title: string;
  items: readonly CollectionShelfItem[];
}) {
  const { t } = useTranslation();
  const smartRouter = useSmartRouter();
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const visible = open ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="flex items-baseline gap-2 text-xl font-bold tracking-tight text-content sm:text-2xl">
          {title}
          <span className="text-sm font-medium text-content-muted">{items.length}</span>
        </h2>
        {items.length > COLLAPSED_COUNT && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex cursor-pointer items-center gap-1 text-sm text-content-muted transition-colors hover:text-content"
          >
            {open ? t("common.action.showLess") : t("common.action.showAll")}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-x-2 gap-y-4">
        {visible.map((item) => (
          <GridCard
            key={item.id}
            appearance="home"
            id={item.id}
            name={item.title}
            coverUrl={item.coverUrl}
            subtitle={item.subtitle}
            isArtist={item.isArtist}
            isLoading={item.isLoading}
            onPlay={item.onPlay}
            onClick={() => item.href && smartRouter.push(item.href)}
          />
        ))}
      </div>
    </section>
  );
}
