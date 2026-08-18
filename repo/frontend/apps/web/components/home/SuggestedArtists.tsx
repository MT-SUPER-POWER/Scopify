"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GridCard } from "@/components/home/GridCard";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SuggestedArtistsProps } from "@/types/components/home";

const DEFAULT_PAGE_SIZE = 10;

export function SuggestedArtists({ artists, pageSize = DEFAULT_PAGE_SIZE }: SuggestedArtistsProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(artists.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (artists.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setDirection(-1);
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pageCount - 1) {
      setDirection(1);
      setPage((prev) => prev + 1);
    }
  };

  const visibleArtists = isOpen
    ? artists.slice(page * pageSize, (page + 1) * pageSize)
    : artists.slice(0, pageSize);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <h2 className="text-2xl font-bold tracking-tight text-content hover:underline">
            {t("home.suggestedArtists")}
          </h2>
        }
        collapsedHeight="260px"
      >
        <div className="space-y-4">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isOpen ? page : "collapsed"}
                initial={{ opacity: 0, x: direction * 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5"
              >
                {visibleArtists.map((artist) => (
                  <GridCard
                    key={artist.id}
                    id={artist.id}
                    name={artist.name}
                    coverUrl={`${artist.picUrl}?param=200y200`}
                    isArtist
                    onClick={() => smartRouter.push(`/artist?id=${artist.id}`)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {isOpen && pageCount > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <button
                type="button"
                title={t("home.pagination.previous")}
                aria-label={t("home.pagination.previous")}
                disabled={page === 0}
                onClick={handlePreviousPage}
                className="flex size-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-content/10 hover:text-content disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPage(index)}
                    aria-current={page === index ? "page" : undefined}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs font-medium tabular-nums transition-colors",
                      page === index
                        ? "bg-brand font-bold text-brand-foreground shadow-xs"
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
                disabled={page >= pageCount - 1}
                onClick={handleNextPage}
                className="flex size-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-content/10 hover:text-content disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </section>
  );
}
