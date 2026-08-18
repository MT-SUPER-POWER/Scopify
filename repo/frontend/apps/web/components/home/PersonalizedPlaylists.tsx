"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GridCard } from "@/components/home/GridCard";
import { SectionPagination } from "@/components/home/SectionPagination";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { formatPlayCount } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PersonalizedPlaylistsProps } from "@/types/components/home";

const DEFAULT_PAGE_SIZE = 10;

export function PersonalizedPlaylists({
  loadingPlayId,
  onPlayPlaylist,
  pageSize = DEFAULT_PAGE_SIZE,
  playlists,
  userName,
}: PersonalizedPlaylistsProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(playlists.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (playlists.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visiblePlaylists = isOpen
    ? playlists.slice(page * pageSize, (page + 1) * pageSize)
    : playlists.slice(0, pageSize);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <h2 className="text-2xl font-bold tracking-tight text-content hover:underline">
            {t("home.madeFor", { name: userName ?? t("home.you") })}
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
              className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5"
            >
              {visiblePlaylists.map((playlist) => (
                <GridCard
                  key={playlist.id}
                  id={playlist.id}
                  name={playlist.name}
                  coverUrl={`${playlist.picUrl}?param=300y300`}
                  subtitle={t("home.playlistSummary", {
                    plays: formatPlayCount(playlist.playCount),
                    count: playlist.trackCount,
                  })}
                  playCount={playlist.playCount}
                  isLoading={loadingPlayId === `playlist-${playlist.id}`}
                  onPlay={(event) => onPlayPlaylist(playlist.id, event)}
                  onClick={() => smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </section>
  );
}
