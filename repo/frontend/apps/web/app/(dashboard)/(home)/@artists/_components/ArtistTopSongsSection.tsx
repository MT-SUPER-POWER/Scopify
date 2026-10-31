"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useHome } from "../../_components/HomeProvider";
import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { HomeSectionPending } from "../../_components/HomeSectionPending";
import { SectionPagination } from "../../_components/SectionPagination";
import { GridCard } from "@/components/home/GridCard";
import { useHotArtistsQuery, useFollowedArtistsQuery } from "@/hooks/home/useHomeQueries";
import { useLoginStatus } from "@/hooks/auth/useLoginStatus";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { selectFallbackSource, toFallbackSource } from "@/lib/query/fallbackSource";
import { useTranslation } from "react-i18next";

import type { ArtistTopListItem } from "@/types/home/model";

const PAGE_SIZE = 10;

export function ArtistTopSongsSection() {
  const { t } = useTranslation();
  const { actions } = useHome();
  const smartRouter = useSmartRouter();
  const isLogin = useLoginStatus();
  const followed = useFollowedArtistsQuery(isLogin, 30, false);
  const hot = useHotArtistsQuery(50, false);
  const followedItems: ArtistTopListItem[] | undefined = followed.data?.data?.map((artist) => ({
    id: artist.id,
    name: artist.name,
    picUrl: artist.picUrl || artist.avatarUrl || artist.img1v1Url || "",
  }));
  const hotItems = hot.data?.artists?.map((artist) => ({
    id: artist.id,
    name: artist.name,
    picUrl: artist.picUrl || artist.img1v1Url || "",
    musicSize: artist.musicSize,
  }));
  const result = selectFallbackSource<ArtistTopListItem[]>(
    [
      ...(isLogin ? [toFallbackSource(followed, followedItems)] : []),
      toFallbackSource(hot, hotItems),
    ],
    (items) => items.length > 0,
  );
  const artists = result.data ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(artists.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (result.isPending)
    return (
      <HomeSectionPending isPaused={result.isPaused} kind="grid" titleKey="home.artistTopSongs" />
    );
  if (artists.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visibleArtists = isOpen
    ? artists.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : artists.slice(0, PAGE_SIZE);

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
                  isLoading={actions.loadingPlayId === `artist-${artist.id}`}
                  onPlay={(event) => actions.handlePlayArtistTopSongs(artist.id, event)}
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
