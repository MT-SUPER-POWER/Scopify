"use client";

import { Check, LoaderCircle, Music2 } from "lucide-react";

import { getLyricMatchScore } from "@/lib/lyrics/match";
import { useI18n } from "@/store/module/i18n";
import type { FoliaLyricMatchResultsProps } from "@/types/components/lyrics";

export function FoliaLyricMatchResults({
  candidates,
  isDaylight,
  isLoading,
  onSelect,
  selectedId,
  song,
  theme,
}: FoliaLyricMatchResultsProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center opacity-55">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm opacity-55">
        <Music2 className="size-7" />
        <span>{t("lyrics.match.noResults")}</span>
      </div>
    );
  }

  return candidates.map((candidate) => {
    const isSelected = candidate.id === selectedId;
    const score = song ? getLyricMatchScore(song, candidate) : 0;
    return (
      <button
        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
          isSelected
            ? isDaylight
              ? "border-blue-500/30 bg-blue-500/10"
              : "border-blue-500/50 bg-blue-500/20"
            : isDaylight
              ? "border-black/5 bg-black/5 hover:bg-black/10"
              : "border-white/5 bg-white/5 hover:bg-white/10"
        }`}
        key={candidate.id}
        onClick={() => onSelect(candidate.id)}
        type="button"
      >
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
          {candidate.coverUrl ? (
            <img alt="" className="size-full object-cover" src={candidate.coverUrl} />
          ) : (
            <Music2 className="size-4 opacity-45" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{candidate.name}</span>
            <span className="shrink-0 rounded-md bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-400">
              {score}%
            </span>
          </div>
          <div className="truncate text-xs opacity-60">
            {[
              candidate.artistNames.join(", ") || t("common.meta.unknownArtist"),
              candidate.albumName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {isSelected ? (
          <Check className="size-4 shrink-0" style={{ color: theme.accentColor }} />
        ) : null}
      </button>
    );
  });
}
