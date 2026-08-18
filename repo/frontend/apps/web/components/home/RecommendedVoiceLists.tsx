"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { SectionPagination } from "@/components/home/SectionPagination";
import { VoiceList } from "@/components/search/VoiceList";
import { VoiceTranscriptDialog } from "@/components/voice/VoiceTranscriptDialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { RecommendedVoiceListsProps } from "@/types/components/home";
import type { Voice } from "@/types/search";

const DEFAULT_PAGE_SIZE = 6;

export function RecommendedVoiceLists({
  isRefreshing = false,
  onRefresh,
  pageSize = DEFAULT_PAGE_SIZE,
  voices,
}: RecommendedVoiceListsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  const pageCount = Math.max(1, Math.ceil(voices.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  if (voices.length === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage === page) return;
    setDirection(targetPage > page ? 1 : -1);
    setPage(targetPage);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage(0);
    onRefresh?.();
  };

  const visibleVoices = isOpen
    ? voices.slice(page * pageSize, (page + 1) * pageSize)
    : voices.slice(0, pageSize);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-2">
            <h2 className="text-content text-2xl font-bold tracking-tight hover:underline">
              {t("home.recommendedVoiceLists")}
            </h2>
            {onRefresh ? (
              <button
                type="button"
                title={t("home.refreshVoiceLists")}
                aria-label={t("home.refreshVoiceLists")}
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="text-content-muted hover:bg-content/10 hover:text-content flex size-7 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              </button>
            ) : null}
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
        collapsedHeight="244px"
      >
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? page : "collapsed"}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <VoiceList
                voices={visibleVoices}
                variant="preview"
                onViewTranscript={setSelectedVoice}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </CollapsibleSection>
      <VoiceTranscriptDialog
        open={selectedVoice !== null}
        voice={selectedVoice}
        onOpenChange={(open) => {
          if (!open) setSelectedVoice(null);
        }}
      />
    </section>
  );
}
