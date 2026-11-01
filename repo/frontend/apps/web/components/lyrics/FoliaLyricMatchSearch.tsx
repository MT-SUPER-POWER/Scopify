"use client";

import { LoaderCircle, Search } from "lucide-react";

import { FoliaLyricMatchResults } from "@/components/lyrics/FoliaLyricMatchResults";
import { useTranslation } from "react-i18next";

import type { FoliaLyricMatchSearchProps } from "@/types/lyrics/components";

export function FoliaLyricMatchSearch({
  candidates,
  isDaylight,
  isError,
  isLoading,
  onRetry,
  onSearch,
  onSelect,
  query,
  selectedId,
  setQuery,
  song,
  theme,
}: FoliaLyricMatchSearchProps) {
  const { t } = useTranslation();
  const borderClass = isDaylight ? "border-black/5" : "border-white/10";
  const inputClass = isDaylight
    ? "border-black/10 bg-black/5 focus-within:border-black/20 focus-within:bg-black/10"
    : "border-white/10 bg-white/5 focus-within:border-white/20 focus-within:bg-white/10";

  return (
    <section className={`flex min-h-0 flex-col border-b md:border-r md:border-b-0 ${borderClass}`}>
      <div className="shrink-0 p-4">
        <div className={`mb-3.5 flex gap-4 border-b ${borderClass}`}>
          <span
            className="cursor-pointer border-b-2 px-1 pb-2 text-sm font-semibold text-blue-600"
            style={{ borderColor: theme.accentColor }}
          >
            {t("lyrics.match.sourceNetease")}
          </span>
        </div>

        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query);
          }}
        >
          <div
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 ${inputClass}`}
          >
            <Search className="size-[18px] shrink-0 opacity-40" />
            <input
              aria-label={t("lyrics.match.search")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t("lyrics.match.searchPlaceholder")}
              value={query}
            />
          </div>
          <button
            className="flex min-w-16 items-center justify-center rounded-2xl bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading || !query.trim()}
            type="submit"
          >
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              t("lyrics.match.search")
            )}
          </button>
        </form>
      </div>

      <div className="scrollbar-overlay min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-1.5">
          <FoliaLyricMatchResults
            candidates={candidates}
            isDaylight={isDaylight}
            isError={isError}
            isLoading={isLoading}
            onRetry={onRetry}
            onSelect={onSelect}
            selectedId={selectedId}
            song={song}
            theme={theme}
          />
        </div>
      </div>
    </section>
  );
}
