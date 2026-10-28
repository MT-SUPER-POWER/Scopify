"use client";

import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { LoaderCircle, RotateCcw } from "lucide-react";

import { FoliaLyricMatchPreview } from "@/components/lyrics/FoliaLyricMatchPreview";
import { FoliaLyricMatchSearch } from "@/components/lyrics/FoliaLyricMatchSearch";
import { useLyricMatch } from "@/hooks/lyrics/useLyricMatch";
import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricMatchDialogProps } from "@/types/lyrics/components";

export function FoliaLyricMatchDialog({ isOpen, onClose, theme }: FoliaLyricMatchDialogProps) {
  const { t } = useI18n();
  const match = useLyricMatch(isOpen);
  const isDaylight = theme.name === "snow";

  const dialogRef = useFoliaModalFocus(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <FoliaStudioWindow
      panelRef={dialogRef}
      layer={160}
      title={t("lyrics.match.title")}
      backLabel={t("common.action.cancel")}
      onClose={onClose}
      isDaylight={isDaylight}
      colors={theme}
    >
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
    </FoliaStudioWindow>
  );
}
