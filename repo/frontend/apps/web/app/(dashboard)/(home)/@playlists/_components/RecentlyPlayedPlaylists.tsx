"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useHome } from "../../_components/HomeProvider";
import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { HomeSectionPending } from "../../_components/HomeSectionPending";
import { SectionPagination } from "../../_components/SectionPagination";
import { GridCard } from "@/components/home/GridCard";
import { useRecentPlaylistsQuery } from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useTranslation } from "react-i18next";

import { pruneRecommendPlaylist, type RawRecommendPlaylist } from "@/types/playlist/api";

const PAGE_SIZE = 10;

export function RecentlyPlayedPlaylists() {
  const { t } = useTranslation();
  const { actions } = useHome();
  const smartRouter = useSmartRouter();
  const isLogin = useLoginStatus();
  const query = useRecentPlaylistsQuery(isLogin);
  const playlists = (query.data?.data?.list ?? [])
    .map((entry) => entry.data)
    .filter((item): item is RawRecommendPlaylist => Boolean(item?.id && item.name))
    .map(pruneRecommendPlaylist);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(playlists.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (!isLogin) return null;
  if (query.isPending)
    return (
      <HomeSectionPending
        isPaused={query.fetchStatus === "paused"}
        kind="grid"
        titleKey="home.recentlyPlayedPlaylists"
      />
    );
  if (playlists.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visiblePlaylists = isOpen
    ? playlists.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : playlists.slice(0, PAGE_SIZE);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
            {t("home.recentlyPlayedPlaylists")}
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
              {visiblePlaylists.map((playlist) => {
                const subtitle =
                  playlist.trackCount > 0
                    ? t("home.playlistSummary", { count: playlist.trackCount })
                    : playlist.lastSong?.name
                      ? playlist.lastSong.artists
                        ? `${playlist.lastSong.name} · ${playlist.lastSong.artists}`
                        : playlist.lastSong.name
                      : playlist.creatorName || undefined;

                return (
                  <GridCard
                    key={playlist.id}
                    appearance="home"
                    id={playlist.id}
                    name={playlist.name}
                    coverUrl={playlist.picUrl ? `${playlist.picUrl}?param=300y300` : ""}
                    subtitle={subtitle}
                    playCount={playlist.playCount}
                    isLoading={actions.loadingPlayId === `playlist-${playlist.id}`}
                    onPlay={(event) => actions.handlePlayPlaylist(playlist.id, event)}
                    onClick={() =>
                      smartRouter.push(`/playlist/?id=${playlist.id}&isRecommend=true`)
                    }
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
