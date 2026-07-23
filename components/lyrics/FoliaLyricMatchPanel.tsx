"use client";

import { ArrowLeft, Check, LoaderCircle, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import { FoliaLyricMatchPreview } from "@/components/lyrics/FoliaLyricMatchPreview";
import { FoliaLyricMatchSearch } from "@/components/lyrics/FoliaLyricMatchSearch";
import { useLyricMatch } from "@/hooks/lyrics/useLyricMatch";
import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricMatchPanelProps } from "@/types/components/lyrics";

type MatchView = "results" | "preview";

export function FoliaLyricMatchPanel({ onBack, theme }: FoliaLyricMatchPanelProps) {
  const { t } = useI18n();
  const [view, setView] = useState<MatchView>("results");
  const match = useLyricMatch(true);
  const isDaylight = theme.name === "snow";
  const tabContainer = isDaylight ? "bg-black/5" : "bg-white/5";
  const activeTab = isDaylight ? "bg-white text-blue-600 shadow-sm" : "bg-zinc-800 text-blue-300 shadow-sm";

  const selectCandidate = (id: number) => {
    match.setSelectedId(id);
    setView("preview");
  };

  const applyMatch = () => {
    void match.applyMatch().then((applied) => {
      if (applied) onBack();
    });
  };

  return (
    <div className="space-y-3 px-2 pt-0">
      <div className="flex items-center gap-2">
        <button
          aria-label={t("ui.close")}
          className={`rounded-md p-1.5 opacity-60 transition-opacity hover:opacity-100 ${isDaylight ? "hover:bg-black/5" : "hover:bg-white/5"}`}
          onClick={onBack}
          title={t("ui.close")}
          type="button"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-bold tracking-widest uppercase opacity-55">
            {t("lyrics.match.title")}
          </div>
          <div className="truncate text-[10px] opacity-45">
            {match.song?.name ?? t("lyrics.match.noSong")}
          </div>
        </div>
      </div>

      <div className={`flex rounded-lg p-0.5 ${tabContainer}`}>
        {([
          ["results", Search, "lyrics.match.open"],
          ["preview", Check, "lyrics.match.title"],
        ] as const).map(([tab, Icon, label]) => (
          <button
            className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-colors ${
              view === tab ? activeTab : "opacity-55 hover:opacity-100"
            }`}
            key={tab}
            onClick={() => setView(tab)}
            type="button"
          >
            <Icon size={12} />
            {t(label)}
          </button>
        ))}
      </div>

      {view === "results" ? (
        <FoliaLyricMatchSearch
          candidates={match.candidates}
          isDaylight={isDaylight}
          isLoading={match.isLoading}
          onSearch={match.search}
          onSelect={selectCandidate}
          query={match.query}
          selectedId={match.selectedCandidate?.id ?? null}
          setQuery={match.setQuery}
          song={match.song}
          theme={theme}
        />
      ) : (
        <FoliaLyricMatchPreview
          candidate={match.selectedCandidate}
          isDaylight={isDaylight}
          isLoading={match.isPreviewLoading}
          isPureMusic={match.isPreviewPureMusic}
          previewLines={match.previewLines}
          song={match.song}
          theme={theme}
        />
      )}

      <div className={`flex gap-2 border-t pt-3 ${isDaylight ? "border-black/5" : "border-white/5"}`}>
        {match.override ? (
          <button
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
            disabled={match.isApplying}
            onClick={() => void match.restoreOriginalLyrics()}
            title={t("lyrics.match.restore")}
            type="button"
          >
            <RotateCcw size={14} />
          </button>
        ) : null}
        <button
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!match.selectedCandidate || match.isApplying}
          onClick={applyMatch}
          type="button"
        >
          {match.isApplying ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check size={14} />}
          {t("lyrics.match.apply")}
        </button>
      </div>
    </div>
  );
}
