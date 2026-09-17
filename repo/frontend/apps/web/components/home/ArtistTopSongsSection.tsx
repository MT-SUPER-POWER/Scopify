"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GridCard } from "@/components/home/GridCard";
import { SectionPagination } from "@/components/home/SectionPagination";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { ArtistTopSongsSectionProps } from "@/types/components/home";

const DEFAULT_PAGE_SIZE = 10;

export function ArtistTopSongsSection({
  artists,
  loadingPlayId,
  onPlayArtist,
  pageSize = DEFAULT_PAGE_SIZE,
}: ArtistTopSongsSectionProps) {
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

  const visibleArtists = isOpen
    ? artists.slice(page * pageSize, (page + 1) * pageSize)
    : artists.slice(0, pageSize);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
            {t("home.artistTopSongs")}
          </h2>
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
        collapsedRows={1}
        collapsedHeight="280px"
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? page : "collapsed"}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,176px),1fr))] gap-x-2 gap-y-4"
            >
              {visibleArtists.map((artist) => (
                <GridCard
                  key={artist.id}
                  appearance="home"
                  id={artist.id}
                  name={`${artist.name} 热门精选`}
                  coverUrl={artist.picUrl ? `${artist.picUrl}?param=300y300` : ""}
                  subtitle={t("home.artistTopSongsCardSubtitle")}
                  isLoading={loadingPlayId === `artist-${artist.id}`}
                  onPlay={(event) => onPlayArtist(artist.id, event)}
                  onClick={() => smartRouter.push(`/artist?id=${artist.id}`)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </section>
  );
}
