"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play, Search, X } from "lucide-react";
import { BRAVAIS_SEAM_ROW_HEIGHT } from "@/constants/playlistBravais";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { BravaisSeamProps } from "@/types/playlist/bravaisComponents";

/** The gap in the wall: what the page is, a filter for it, the focused song and the song list. */
export function BravaisSeam({
  title,
  tracks,
  contentWidth,
  query,
  onQueryChange,
  matches,
  selectedIndex,
  currentIndex,
  isPlaying,
  onSelect,
  onPlay,
}: BravaisSeamProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // The wall pans on wheel with a native listener; keep wheel over the panel for its own list.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const stop = (event: WheelEvent) => event.stopPropagation();
    card.addEventListener("wheel", stop);
    return () => card.removeEventListener("wheel", stop);
  }, []);
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => BRAVAIS_SEAM_ROW_HEIGHT,
    overscan: 8,
  });
  const totalMinutes = Math.round(tracks.reduce((sum, track) => sum + track.dt, 0) / 60000);
  const focused = selectedIndex !== null ? tracks[selectedIndex] : undefined;
  const focusedArtist = focused?.ar.map((item) => item.name).join(" / ");
  const focusedPlaying = focused !== undefined && selectedIndex === currentIndex && isPlaying;
  return (
    <div
      className="absolute inset-y-0 overflow-hidden"
      style={{
        left: "calc(var(--seam-c, 0px) - var(--seam, 0px) / 2)",
        width: "var(--seam, 0px)",
      }}
    >
      <div
        ref={cardRef}
        className="absolute inset-y-3 left-1/2 flex -translate-x-1/2 flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
        style={{ width: contentWidth - 16 }}
      >
        <header className="min-w-0">
          <h2 className="truncate text-lg leading-tight font-bold tracking-tight" title={title}>
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {t("playlist.bravais.summary", { count: tracks.length, minutes: totalMinutes })}
          </p>
        </header>
        <label className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-content/8 px-2.5 text-sm focus-within:bg-content/12">
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
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              aria-label={t("common.action.close")}
              onClick={() => onQueryChange("")}
              className="grid size-5 place-items-center rounded-full hover:bg-content/15"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
        {focused && selectedIndex !== null && (
          <section
            className="flex shrink-0 items-center gap-3 rounded-xl bg-content/6 p-2.5"
            aria-label={focused.name}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {(focused.al.picUrl || focused.al.coverUrl) && (
                <img
                  src={getSizedImageUrl(focused.al.picUrl || focused.al.coverUrl, 200)}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="line-clamp-2 text-sm leading-snug font-bold" title={focused.name}>
                {focused.name}
              </strong>
              <p className="truncate text-xs text-muted-foreground" title={focusedArtist}>
                {focusedArtist}
              </p>
              <p className="truncate text-[11px] text-muted-foreground/70" title={focused.al.name}>
                {focused.al.name}
              </p>
            </div>
            <button
              type="button"
              aria-label={`${t(focusedPlaying ? "ui.pause" : "ui.play")} ${focused.name}`}
              onClick={() => onPlay(focused)}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:size-5"
            >
              {focusedPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            </button>
          </section>
        )}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
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
                        "group/row flex size-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-content/8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                        index === selectedIndex && "bg-content/10",
                        isCurrent && "text-primary",
                      )}
                    >
                      <span className="w-6 shrink-0 text-center font-mono text-[11px] tabular-nums opacity-55">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium" title={track.name}>
                          {track.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {track.ar.map((artist) => artist.name).join(" / ")}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-55">
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
    </div>
  );
}
