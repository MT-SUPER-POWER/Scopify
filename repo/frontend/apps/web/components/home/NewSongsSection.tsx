"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { SectionPagination } from "@/components/home/SectionPagination";
import { NewSongItem } from "@/components/home/NewSongItem";
import { useI18n } from "@/store/module/i18n";
import type { NewSongsSectionProps } from "@/types/components/home";

const DEFAULT_PAGE_SIZE = 6;

export function NewSongsSection({
  onPlayAll,
  onPlaySong,
  pageSize = DEFAULT_PAGE_SIZE,
  songs,
}: NewSongsSectionProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(songs.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (songs.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visibleSongs = isOpen
    ? songs.slice(page * pageSize, (page + 1) * pageSize)
    : songs.slice(0, pageSize);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
              {t("home.newSongs")}
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAll();
              }}
              className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              <Play className="size-3 fill-current" />
              <span>{t("home.playAll")}</span>
            </button>
          </div>
        }
        action={
          isOpen && pageCount > 1 ? (
            <SectionPagination
              currentPage={page}
              pageCount={pageCount}
              onPageChange={handleSelectPage}
            />
          ) : null
        }
        disableHeightCollapse
        showTrigger={pageCount > 1}
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? page : "collapsed"}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2"
            >
              {visibleSongs.map((song, idx) => {
                const globalIndex = isOpen ? page * pageSize + idx : idx;
                return (
                  <NewSongItem key={song.id} song={song} index={globalIndex} onPlay={onPlaySong} />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </section>
  );
}
