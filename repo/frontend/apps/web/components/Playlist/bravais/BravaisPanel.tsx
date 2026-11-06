"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Disc3, Pause, Play, Search, X } from "lucide-react";
import { BRAVAIS_PANEL_ROW_HEIGHT } from "@/constants/playlistBravais";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { BravaisPanelProps } from "@/types/playlist/bravaisComponents";

/**
 * The page's information and song list, fixed in the split between the wall's two halves. It has no
 * surface of its own: the list sits straight on the dark the wall stands on, and only the posters on
 * either side give it its edges. Selecting on the wall brings the song's row into view here.
 */
export function BravaisPanel({
  title,
  tracks,
  width,
  query,
  onQueryChange,
  matches,
  selectedIndex,
  currentIndex,
  isPlaying,
  onSelect,
  onPlay,
}: BravaisPanelProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => BRAVAIS_PANEL_ROW_HEIGHT,
    overscan: 8,
    paddingStart: 8,
    paddingEnd: 24,
    scrollPaddingStart: 16,
    scrollPaddingEnd: 24,
  });
  useEffect(() => {
    if (selectedIndex === null) return;
    const position = matches.indexOf(selectedIndex);
    if (position >= 0) virtualizer.scrollToIndex(position, { align: "auto" });
  }, [matches, selectedIndex, virtualizer]);
  const totalMinutes = Math.round(tracks.reduce((sum, track) => sum + track.dt, 0) / 60000);
  // Play the selected song, else the one that is playing, else the first the filter lets through.
  const target = tracks[selectedIndex ?? currentIndex] ?? tracks[matches[0] ?? 0];
  const targetPlaying =
    target !== undefined && tracks.indexOf(target) === currentIndex && isPlaying;
  const targetLabel = target && `${t(targetPlaying ? "ui.pause" : "ui.play")} ${target.name}`;
  return (
    <div
      className="absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 flex-col overflow-hidden bg-card text-foreground"
      style={{ width }}
    >
      <header className="shrink-0 px-5 pt-5 pb-2">
        <h2
          className="line-clamp-2 text-[22px] leading-snug font-semibold text-balance"
          title={title}
        >
          {title}
        </h2>
        <p className="mt-1 truncate text-xs text-foreground/60 tabular-nums">
          {t("playlist.bravais.summary", { count: tracks.length, minutes: totalMinutes })}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {target && (
            <button
              type="button"
              onClick={() => onPlay(target)}
              aria-label={targetLabel}
              title={targetLabel}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 [&_svg]:size-4"
            >
              {targetPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            </button>
          )}
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-foreground/8 px-3.5 text-sm transition-colors focus-within:bg-foreground/12 hover:bg-foreground/12">
            <Search className="size-4 shrink-0 opacity-60" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                  event.preventDefault();
                  event.stopPropagation();
                  onQueryChange("");
                }
              }}
              placeholder={t("playlist.actions.searchPlaceholder")}
              aria-label={t("playlist.actions.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-foreground/50"
            />
            {query && (
              <button
                type="button"
                aria-label={t("common.action.close")}
                onClick={() => onQueryChange("")}
                className="grid size-5 shrink-0 place-items-center rounded-full hover:bg-foreground/12"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        </div>
      </header>
      {/* Rows fade out at both ends of the list instead of being cut off. */}
      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,#000_12px,#000_calc(100%-32px),transparent)] px-2"
      >
        {matches.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            {t("playlist.table.noSongs")}
          </p>
        ) : (
          <ul className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => {
              const index = matches[item.index];
              const track = tracks[index];
              if (!track) return null;
              const isCurrent = index === currentIndex;
              const rowPlaying = isCurrent && isPlaying;
              const cover = track.al.picUrl || track.al.coverUrl;
              return (
                <li
                  key={`${index}:${track.id}`}
                  className="absolute inset-x-0"
                  style={{ top: item.start, height: item.size }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-current={isCurrent || undefined}
                    onClick={() => onSelect(index)}
                    onDoubleClick={() => onPlay(track)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter") onPlay(track);
                      else if (event.key === " ") {
                        event.preventDefault();
                        onSelect(index);
                      }
                    }}
                    className={cn(
                      "group/row grid size-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-foreground/8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                      index === selectedIndex && "bg-foreground/12 hover:bg-foreground/12",
                    )}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`${t(rowPlaying ? "ui.pause" : "ui.play")} ${track.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onPlay(track);
                      }}
                      onDoubleClick={(event) => event.stopPropagation()}
                      className="relative size-10 overflow-hidden rounded-md bg-foreground/10 text-white"
                    >
                      <Disc3 className="absolute inset-2.5 size-5 opacity-30" aria-hidden="true" />
                      {cover && (
                        <img
                          src={getSizedImageUrl(cover, 80)}
                          alt=""
                          draggable={false}
                          decoding="async"
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.visibility = "hidden";
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          "absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover/row:opacity-100 [&_svg]:size-4",
                          isCurrent && "opacity-100",
                        )}
                      >
                        {rowPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                      </span>
                    </button>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate text-sm font-medium",
                          isCurrent && "font-semibold text-primary",
                        )}
                        title={track.name}
                      >
                        {track.name}
                      </span>
                      <span className="truncate text-xs text-foreground/60">
                        {track.ar.map((artist) => artist.name).join(" / ")}
                      </span>
                    </span>
                    <span className="text-xs text-foreground/50 tabular-nums">
                      {formatDuration(track.dt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
