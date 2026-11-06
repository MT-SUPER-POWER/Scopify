"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play, Search, X } from "lucide-react";
import { BRAVAIS_PANEL_ROW_HEIGHT } from "@/constants/playlistBravais";
import { cn, formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { BravaisPanelProps } from "@/types/playlist/bravaisComponents";

/**
 * The page's information and song list, pinned to the middle of the pane; the wall slides behind it.
 * The selected song is marked in the list and on the wall.
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
  });
  const totalMinutes = Math.round(tracks.reduce((sum, track) => sum + track.dt, 0) / 60000);
  // Play the selected song, else the one that is playing, else the first the filter lets through.
  const target = tracks[selectedIndex ?? currentIndex] ?? tracks[matches[0] ?? 0];
  const targetIndex = tracks.indexOf(target);
  const targetPlaying = target !== undefined && targetIndex === currentIndex && isPlaying;
  return (
    <div
      className="absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 flex-col gap-2.5 bg-[color-mix(in_srgb,var(--card)_90%,var(--foreground))] px-[22px] pt-[22px] pb-4 text-foreground shadow-[0_24px_64px_rgb(0_0_0/42%)]"
      style={{ width }}
    >
      <p className="truncate text-[11px] tracking-[0.08em] text-foreground/55 tabular-nums">
        {t("playlist.bravais.summary", { count: tracks.length, minutes: totalMinutes })}
      </p>
      <h2
        className="leading-1.15 truncate text-2xl font-extrabold tracking-[-0.01em]"
        title={title}
      >
        {title}
      </h2>
      <label className="flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-foreground/18 px-2.5 text-xs focus-within:border-foreground/40">
        <Search className="size-3.5 shrink-0 opacity-55" aria-hidden="true" />
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
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-foreground/45"
        />
        {query && (
          <button
            type="button"
            aria-label={t("common.action.close")}
            onClick={() => onQueryChange("")}
            className="grid size-5 place-items-center rounded-full hover:bg-foreground/12"
          >
            <X className="size-3.5" />
          </button>
        )}
      </label>
      <div ref={scrollRef} className="-mx-2.5 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {matches.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/55">
            {t("playlist.table.noSongs")}
          </p>
        ) : (
          <ul className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((item) => {
              const index = matches[item.index];
              const track = tracks[index];
              if (!track) return null;
              const isCurrent = index === currentIndex;
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
                      if (event.key === "Enter") onPlay(track);
                      else if (event.key === " ") {
                        event.preventDefault();
                        onSelect(index);
                      }
                    }}
                    className={cn(
                      "grid size-full cursor-pointer grid-cols-[4ch_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px] px-2.5 text-left hover:bg-foreground/12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                      index === selectedIndex && "bg-foreground/12",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-extrabold tracking-[0.08em] tabular-nums",
                        isCurrent ? "text-primary" : "text-foreground/55",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <strong className="truncate text-[13px] font-bold" title={track.name}>
                        {track.name}
                      </strong>
                      <small className="truncate text-[11px] text-foreground/55">
                        {track.ar.map((artist) => artist.name).join(" / ")}
                      </small>
                    </span>
                    <span className="text-[11px] text-foreground/55 tabular-nums">
                      {formatDuration(track.dt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {target && (
        <button
          type="button"
          onClick={() => onPlay(target)}
          className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-foreground/18 text-xs font-semibold hover:border-foreground/40 hover:bg-foreground/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:size-3.5"
        >
          {targetPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          <span className="truncate">
            {t(targetPlaying ? "ui.pause" : "ui.play")} · {target.name}
          </span>
        </button>
      )}
    </div>
  );
}
