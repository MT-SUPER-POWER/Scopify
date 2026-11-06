"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play, Search, X } from "lucide-react";
import { BRAVAIS_SEAM_ROW_HEIGHT } from "@/constants/playlistBravais";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn, formatDuration } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { BravaisSeamProps } from "@/types/playlist/bravaisComponents";

/**
 * The gap in the wall, cut into it like a recess: the focused song's cover, blurred, lights the gap;
 * its sides carry an inset shadow where the posters were cut. Inside sit the page, the focused song
 * and the song list.
 */
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
  const stripRef = useRef<HTMLDivElement>(null);
  // The wall pans on wheel with a native listener; keep wheel over the panel for its own list.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const stop = (event: WheelEvent) => event.stopPropagation();
    strip.addEventListener("wheel", stop);
    return () => strip.removeEventListener("wheel", stop);
  }, []);
  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => BRAVAIS_SEAM_ROW_HEIGHT,
    overscan: 8,
  });
  const totalMinutes = Math.round(tracks.reduce((sum, track) => sum + track.dt, 0) / 60000);
  const focused = selectedIndex !== null ? tracks[selectedIndex] : undefined;
  const lit = focused ?? tracks[currentIndex] ?? tracks[0];
  const litCover = lit ? lit.al.picUrl || lit.al.coverUrl : undefined;
  const focusedArtist = focused?.ar.map((item) => item.name).join(" / ");
  const focusedPlaying = focused !== undefined && selectedIndex === currentIndex && isPlaying;
  const inner = contentWidth - 40;
  return (
    <div
      className="absolute inset-y-0 overflow-hidden"
      style={{
        left: "calc(var(--seam-screen, 0px) / -2)",
        width: "var(--seam-screen, 0px)",
      }}
    >
      <div
        ref={stripRef}
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 overflow-hidden bg-[#0b0b0d] text-white"
        style={{ width: contentWidth }}
      >
        {litCover && (
          <img
            key={litCover}
            src={getSizedImageUrl(litCover, 200)}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 size-full scale-150 animate-in object-cover opacity-60 blur-3xl saturate-150 duration-700 fade-in"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b0b0d55_0%,#0b0b0dcc_55%,#0b0b0df2_100%)]" />
        {/* Where the posters were cut: the gap is recessed, so its sides fall into shadow. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/70 to-transparent" />
        <div
          className="relative flex h-full flex-col gap-4 py-5"
          style={{ width: contentWidth, paddingInline: 20 }}
        >
          <header className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-[0.14em] text-white/55 uppercase tabular-nums">
              {t("playlist.bravais.summary", { count: tracks.length, minutes: totalMinutes })}
            </p>
            <h2
              className="mt-1 truncate text-[26px] leading-tight font-extrabold tracking-tight"
              title={title}
            >
              {title}
            </h2>
          </header>
          {focused && selectedIndex !== null && (
            <section className="flex shrink-0 flex-col gap-3" aria-label={focused.name}>
              <div
                className="group/hero relative mx-auto shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-[0_18px_40px_-8px_#000c]"
                style={{ width: Math.min(inner, 210), aspectRatio: "1" }}
              >
                {(focused.al.picUrl || focused.al.coverUrl) && (
                  <img
                    src={getSizedImageUrl(focused.al.picUrl || focused.al.coverUrl, 500)}
                    alt=""
                    className="size-full object-cover"
                    draggable={false}
                  />
                )}
                <button
                  type="button"
                  aria-label={`${t(focusedPlaying ? "ui.pause" : "ui.play")} ${focused.name}`}
                  onClick={() => onPlay(focused)}
                  className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full bg-black/55 opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-200 group-hover/hero:opacity-100 hover:scale-105 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white data-[playing=true]:opacity-100 [&_svg]:size-6"
                  data-playing={focusedPlaying}
                >
                  {focusedPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                </button>
              </div>
              <div className="min-w-0 text-center">
                <strong
                  className="line-clamp-2 text-[17px] leading-snug font-bold"
                  title={focused.name}
                >
                  {focused.name}
                </strong>
                <p className="mt-0.5 truncate text-[13px] text-white/65" title={focusedArtist}>
                  {focusedArtist}
                </p>
                <p className="truncate text-[11px] text-white/40" title={focused.al.name}>
                  {focused.al.name}
                </p>
              </div>
            </section>
          )}
          <label className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 text-sm backdrop-blur-sm focus-within:bg-white/15">
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
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/45"
            />
            {query && (
              <button
                type="button"
                aria-label={t("common.action.close")}
                onClick={() => onQueryChange("")}
                className="grid size-5 place-items-center rounded-full hover:bg-white/15"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
          <div
            ref={scrollRef}
            className="-mx-2 min-h-0 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain [mask-image:linear-gradient(180deg,transparent,#000_12px,#000_calc(100%-20px),transparent)] px-2"
          >
            {matches.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/55">
                {t("playlist.table.noSongs")}
              </p>
            ) : (
              <ul className="relative py-1.5" style={{ height: virtualizer.getTotalSize() + 12 }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const index = matches[item.index];
                  const track = tracks[index];
                  if (!track) return null;
                  const isCurrent = index === currentIndex;
                  return (
                    <li
                      key={`${index}:${track.id}`}
                      className="absolute inset-x-0"
                      style={{ top: item.start + 6, height: item.size }}
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
                          "relative flex size-full cursor-pointer items-center gap-3 rounded-xl px-2.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/70",
                          index === selectedIndex && "bg-white/14",
                          isCurrent && "text-primary",
                        )}
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-[11px] tabular-nums opacity-50">
                          {isCurrent ? (
                            <span className="mx-auto block size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13px] leading-tight font-semibold"
                            title={track.name}
                          >
                            {track.name}
                          </span>
                          <span className="block truncate text-[11px] text-white/50">
                            {track.ar.map((artist) => artist.name).join(" / ")}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-45">
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
    </div>
  );
}
