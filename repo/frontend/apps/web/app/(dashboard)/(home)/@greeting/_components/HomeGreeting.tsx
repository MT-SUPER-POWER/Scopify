"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { HomeDailyRecommendation } from "./HomeDailyRecommendation";
import { useHome } from "../../_components/HomeProvider";
import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { SectionPagination } from "../../_components/SectionPagination";
import { useSuspensePersonalizedPlaylistsQuery } from "@/hooks/home/useHomeQueries";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useTranslation } from "react-i18next";

import { pruneRecommendPlaylist } from "@/types/playlist/api";

const PAGE_SIZE = 9;

export function HomeGreeting() {
  const { t } = useTranslation();
  const { actions, dateInfo, greeting } = useHome();
  const smartRouter = useSmartRouter();
  const query = useSuspensePersonalizedPlaylistsQuery();
  const playlists = query.data.result?.map(pruneRecommendPlaylist) ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // The first page reserves one slot for daily recommendations.
  const page0PlaylistCount = Math.max(1, PAGE_SIZE - 1);
  const remainingPlaylists = Math.max(0, playlists.length - page0PlaylistCount);
  const subsequentPageCount = Math.ceil(remainingPlaylists / PAGE_SIZE);
  const pageCount = Math.max(1, 1 + subsequentPageCount);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const currentPlaylists =
    page === 0
      ? playlists.slice(0, page0PlaylistCount)
      : playlists.slice(
          page0PlaylistCount + (page - 1) * PAGE_SIZE,
          page0PlaylistCount + page * PAGE_SIZE,
        );

  const displayPlaylists = isOpen
    ? currentPlaylists
    : playlists.slice(0, Math.max(page0PlaylistCount, PAGE_SIZE));

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-4">
            <h1 className="text-2xl leading-tight font-bold tracking-tight text-content">
              {greeting}
            </h1>
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
        collapsedRows={2}
        collapsedHeight="140px"
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? page : "collapsed"}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3"
            >
              {(page === 0 || !isOpen) && <HomeDailyRecommendation dateInfo={dateInfo} />}

              {displayPlaylists.map((item) => (
                <div
                  key={item.id}
                  data-section-item
                  onClick={() => smartRouter.push(`/playlist/?id=${item.id}&isRecommend=true`)}
                  className="group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md bg-content/10 pr-4 transition-colors hover:bg-content/20"
                >
                  <Image
                    width={64}
                    height={64}
                    src={item.picUrl}
                    alt={t("playlist.form.coverAlt")}
                    className="z-10 size-16 object-cover shadow-calendar"
                  />
                  <span className="ml-4 truncate text-sm font-medium text-content">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => actions.handlePlayPlaylist(item.id, event)}
                    disabled={actions.loadingPlayId === `playlist-${item.id}`}
                    className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
                  >
                    {actions.loadingPlayId === `playlist-${item.id}` ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="ml-1 size-5 fill-current" />
                    )}
                  </button>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
    </section>
  );
}
