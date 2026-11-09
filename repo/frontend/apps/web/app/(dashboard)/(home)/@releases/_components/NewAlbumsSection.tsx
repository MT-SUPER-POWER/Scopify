"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useHome } from "../../_components/HomeProvider";
import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { SectionPagination } from "../../_components/SectionPagination";
import { GridCard } from "@/components/home/GridCard";
import { useNewAlbumsQuery } from "@/hooks/home/useHomeQueries";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 10;

export function NewAlbumsSection() {
  const { t } = useTranslation();
  const { actions } = useHome();
  const smartRouter = useSmartRouter();
  const query = useNewAlbumsQuery();
  const albums = query.data;
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const pageCount = Math.max(1, Math.ceil(albums.length / PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (albums.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const visibleAlbums = isOpen
    ? albums.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : albums.slice(0, PAGE_SIZE);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">
            {t("home.newAlbums")}
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
              {visibleAlbums.map((album) => {
                const albumId = album.ref.id;
                const year = album.publishedAt
                  ? new Date(album.publishedAt).getFullYear()
                  : undefined;
                const artistName = album.artists[0]?.name;
                const subtitle =
                  year && artistName
                    ? t("home.albumSummary", {
                        artist: artistName,
                        year,
                      })
                    : artistName || "";

                return (
                  <GridCard
                    key={albumId}
                    appearance="home"
                    id={albumId}
                    name={album.title}
                    coverUrl={getSizedImageUrl(album.coverUrl, 300)}
                    subtitle={subtitle}
                    isLoading={actions.loadingPlayId === `album-${albumId}`}
                    onPlay={(event) => actions.handlePlayAlbum(albumId, event)}
                    onClick={() => smartRouter.push(`/album?id=${albumId}`)}
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
