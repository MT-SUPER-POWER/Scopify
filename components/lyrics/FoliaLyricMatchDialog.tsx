"use client";

import { LoaderCircle, RotateCcw, X } from "lucide-react";

import { FoliaLyricMatchPreview } from "@/components/lyrics/FoliaLyricMatchPreview";
import { FoliaLyricMatchSearch } from "@/components/lyrics/FoliaLyricMatchSearch";
import { useLyricMatch } from "@/hooks/lyrics/useLyricMatch";
import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricMatchDialogProps } from "@/types/components/lyrics";

export function FoliaLyricMatchDialog({ isOpen, onClose, theme }: FoliaLyricMatchDialogProps) {
  const { t } = useI18n();
  const match = useLyricMatch(isOpen);
  const isDaylight = theme.name === "snow";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-160 flex items-center justify-center bg-black/60 p-6 backdrop-blur-xl"
      onClick={onClose}
    >
      <section
        aria-label={t("lyrics.match.title")}
        aria-modal="true"
        role="dialog"
        className={`flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md ${
          isDaylight
            ? "border-white/20 bg-white/90 text-zinc-900"
            : "border-white/10 bg-zinc-900/95 text-white"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          className={`flex items-center justify-between border-b px-6 py-4 ${isDaylight ? "border-black/5" : "border-white/10"}`}
        >
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{t("lyrics.match.title")}</h2>
            <p className="mt-1 truncate text-xs opacity-60">
              {match.song?.name ?? t("lyrics.match.noSong")}
            </p>
          </div>
          <button
            aria-label={t("common.action.cancel")}
            className={`rounded-lg p-2 transition-colors ${isDaylight ? "hover:bg-zinc-200/50" : "hover:bg-white/10"}`}
            onClick={onClose}
            title={t("common.action.cancel")}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <FoliaLyricMatchSearch
            candidates={match.candidates}
            isDaylight={isDaylight}
            isLoading={match.isLoading}
            onSearch={match.search}
            onSelect={match.setSelectedId}
            query={match.query}
            selectedId={match.selectedCandidate?.id ?? null}
            setQuery={match.setQuery}
            song={match.song}
            theme={theme}
          />
          <FoliaLyricMatchPreview
            candidate={match.selectedCandidate}
            isDaylight={isDaylight}
            isLoading={match.isPreviewLoading}
            isPureMusic={match.isPreviewPureMusic}
            previewLines={match.previewLines}
            song={match.song}
            theme={theme}
          />
        </div>

        <footer
          className={`flex justify-end gap-3 border-t px-6 py-4 ${isDaylight ? "border-black/5" : "border-white/10"}`}
        >
          {match.override ? (
            <button
              className={`mr-auto flex items-center gap-2 rounded-lg border px-5 py-2 text-sm text-red-400 transition-colors disabled:opacity-40 ${isDaylight ? "border-red-500/10 bg-red-500/5 hover:bg-red-500/10" : "border-red-500/20 bg-red-500/10 hover:bg-red-500/20"}`}
              disabled={match.isApplying}
              onClick={() => void match.restoreOriginalLyrics()}
              type="button"
            >
              <RotateCcw className="size-4" />
              {t("lyrics.match.restore")}
            </button>
          ) : (
            <span />
          )}
          <button
            className={`rounded-lg px-5 py-2 text-sm transition-colors ${isDaylight ? "bg-zinc-100/80 hover:bg-zinc-200" : "bg-white/5 hover:bg-white/10"}`}
            onClick={onClose}
            type="button"
          >
            {t("common.action.cancel")}
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!match.selectedCandidate || match.isApplying}
            onClick={() => void match.applyMatch().then((applied) => applied && onClose())}
            type="button"
          >
            {match.isApplying ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              t("lyrics.match.apply")
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
