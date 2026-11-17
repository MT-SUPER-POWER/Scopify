"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  normalizeCommandSearchText,
  tokenizeCommandSearchQuery,
} from "@/lib/commandWorkspace/commandSearch";
import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";

interface PlaylistWallSearchProps {
  tracks: PlaylistLatticeProps["tracks"];
  triggerClassName: string;
  onLocate: (index: number) => void;
}

export function PlaylistWallSearch({
  tracks,
  triggerClassName,
  onLocate,
}: PlaylistWallSearchProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    node?.focus({ preventScroll: true });
  }, []);
  const listRef = useRef<HTMLDivElement>(null);
  const label = t("playlist.lattice.searchTracks");
  const index = useMemo(
    () =>
      open
        ? tracks.map((track) => {
            const { title, artist, album } = trackCopy(track);
            return normalizeCommandSearchText([title, artist, album].join(" "));
          })
        : [],
    [open, tracks],
  );
  const matches = useMemo(() => {
    const terms = tokenizeCommandSearchQuery(query);
    if (terms.length === 0) return [];
    return index.flatMap((title, position) =>
      terms.every((term) => title.includes(term)) ? [position] : [],
    );
  }, [index, query]);
  const list = useVirtualizer({
    count: matches.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 3,
  });

  const close = () => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        disabled={tracks.length === 0}
        onClick={() => setOpen(true)}
      >
        <Search />
        {label}
      </button>
    );
  }

  return (
    <div
      className="px-2.5 py-1"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
    >
      <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2">
        <Search className="size-4 shrink-0" aria-hidden />
        <input
          ref={focusInput}
          type="search"
          aria-label={label}
          placeholder={label}
          className="h-9 min-w-0 flex-1 bg-transparent text-[13px] outline-none [&::-webkit-search-cancel-button]:hidden"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (listRef.current) listRef.current.scrollTop = 0;
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || matches.length === 0) return;
            if (event.key === "Enter") {
              event.preventDefault();
              onLocate(matches[0]);
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              listRef.current?.querySelector("button")?.focus();
            }
          }}
        />
        <button
          type="button"
          className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          aria-label={t("ui.close")}
          onClick={close}
        >
          <X className="size-4" />
        </button>
      </div>
      {query.trim() && matches.length === 0 && (
        <p role="status" className="my-2 text-xs text-white/65">
          {t("playlist.table.searchNoResults", { query })}
        </p>
      )}
      {matches.length > 0 && (
        <div
          ref={listRef}
          className="mt-1 overflow-auto overscroll-contain"
          style={{ height: Math.min(matches.length * 44, 176) }}
        >
          <ul className="relative" style={{ height: list.getTotalSize() }}>
            {list.getVirtualItems().map((row) => {
              const position = matches[row.index];
              const { title, artist, album } = trackCopy(tracks[position]);
              return (
                <li
                  key={row.key}
                  className="absolute inset-x-0"
                  style={{ top: row.start, height: row.size }}
                >
                  <button
                    type="button"
                    className="flex size-full items-center gap-3 rounded-lg px-2 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                    onClick={() => onLocate(position)}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                      event.preventDefault();
                      const next = row.index + (event.key === "ArrowDown" ? 1 : -1);
                      if (next < 0) {
                        inputRef.current?.focus();
                        return;
                      }
                      if (next >= matches.length) return;
                      list.scrollToIndex(next);
                      requestAnimationFrame(() => {
                        listRef.current
                          ?.querySelector<HTMLButtonElement>(`[data-match="${next}"]`)
                          ?.focus({ preventScroll: true });
                      });
                    }}
                    data-match={row.index}
                  >
                    <span className="shrink-0 text-xs text-white/55 tabular-nums">
                      {position + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block truncate text-[13px]">
                        {title}
                      </span>
                      <span dir="auto" className="block truncate text-[11px] text-white/65">
                        {artist || album}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function trackCopy(track: PlaylistLatticeProps["tracks"][number]) {
  return {
    title: track.title,
    artist: track.artists.map((item) => item.name).join(" / "),
    album: track.album?.title ?? "",
  };
}
