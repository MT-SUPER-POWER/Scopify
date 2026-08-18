"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { SectionPagination } from "@/components/home/SectionPagination";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { HomeGreetingSectionProps } from "@/types/components/home";

const DEFAULT_PAGE_SIZE = 9;

export function HomeGreetingSection({
  dateInfo,
  greeting,
  loadingPlayId,
  onPlayPlaylist,
  pageSize = DEFAULT_PAGE_SIZE,
  playlists,
}: HomeGreetingSectionProps) {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Page 0 takes 1 calendar slot + (pageSize - 1) playlists = 9 items (3 rows). Subsequent pages take pageSize (9) playlists.
  const page0PlaylistCount = Math.max(1, pageSize - 1);
  const remainingPlaylists = Math.max(0, playlists.length - page0PlaylistCount);
  const subsequentPageCount = Math.ceil(remainingPlaylists / pageSize);
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
          page0PlaylistCount + (page - 1) * pageSize,
          page0PlaylistCount + page * pageSize,
        );

  const displayPlaylists = isOpen
    ? currentPlaylists
    : playlists.slice(0, Math.max(page0PlaylistCount, pageSize));

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-4">
            <h1 className="text-3xl leading-none font-bold tracking-tight text-content">
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
        collapsedHeight="150px"
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? page : "collapsed"}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid grid-cols-2 gap-3 lg:grid-cols-3"
            >
              {(page === 0 || !isOpen) && (
                <div
                  onClick={() => smartRouter.push("/playlist/?isDailyRecommend=true")}
                  className="group relative flex h-16 cursor-pointer items-center overflow-hidden rounded-md bg-content/10 pr-4 transition-colors hover:bg-content/20"
                >
                  <div className="z-10 flex size-16 shrink-0 flex-col overflow-hidden rounded-l-md bg-calendar-surface shadow-calendar select-none">
                    <div className="flex h-5.5 items-center justify-center border-b border-calendar-divider bg-linear-to-b from-calendar-accent to-calendar-accent-hover">
                      <span className="text-[10px] font-medium tracking-[0.15em] text-calendar-surface">
                        {dateInfo.dayOfWeek}
                      </span>
                    </div>
                    <div className="relative flex flex-1 items-center justify-center bg-linear-to-b from-calendar-surface from-50% to-calendar-surface-muted to-50%">
                      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-calendar-divider" />
                      <span className="z-10 mt-1 text-3xl leading-none font-black tracking-tighter text-calendar-ink">
                        {dateInfo.dateNum}
                      </span>
                    </div>
                  </div>
                  <span className="ml-4 truncate text-sm font-bold text-content">
                    {t("home.dailyRecommendations")}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      smartRouter.push("/playlist/?isDailyRecommend=true");
                    }}
                    className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
                  >
                    <Play className="ml-1 size-5 fill-current" />
                  </button>
                </div>
              )}

              {displayPlaylists.map((item) => (
                <div
                  key={item.id}
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
                  <span className="ml-4 truncate text-sm font-bold text-content">{item.name}</span>
                  <button
                    type="button"
                    onClick={(event) => onPlayPlaylist(item.id, event)}
                    disabled={loadingPlayId === `playlist-${item.id}`}
                    className="absolute right-4 z-20 flex size-10 translate-y-2 items-center justify-center rounded-full bg-brand text-brand-foreground opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-brand-hover"
                  >
                    {loadingPlayId === `playlist-${item.id}` ? (
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
