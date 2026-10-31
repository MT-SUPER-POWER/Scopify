"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import { NewSongItem } from "./NewSongItem";
import { useHome } from "../../_components/HomeProvider";
import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { HomeSectionPending } from "../../_components/HomeSectionPending";
import { SectionPagination } from "../../_components/SectionPagination";
import { useNewSongsQuery } from "@/hooks/home/useHomeQueries";
import { useI18n } from "@/store/module/i18n";
import { pruneSongDetail } from "@/types/song/api";

const PAGE_SIZE = 6;

export function NewSongsSection() {
  const { t } = useI18n();
  const { actions } = useHome();
  const query = useNewSongsQuery();
  const songs = (query.data?.result ?? [])
    .map((item) => pruneSongDetail(item.song))
    .filter((song) => Boolean(song?.id));
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(songs.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (query.isPending)
    return (
      <HomeSectionPending
        isPaused={query.fetchStatus === "paused"}
        kind="songs"
        titleKey="home.newSongs"
      />
    );
  if (songs.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visibleSongs = isOpen
    ? songs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : songs.slice(0, PAGE_SIZE);

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
                void actions.playSongs(songs, 0);
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
                const globalIndex = isOpen ? page * PAGE_SIZE + idx : idx;
                return (
                  <NewSongItem
                    key={song.id}
                    song={song}
                    index={globalIndex}
                    onPlay={(_song, index) => actions.playSongs(songs, index)}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </section>
  );
}
