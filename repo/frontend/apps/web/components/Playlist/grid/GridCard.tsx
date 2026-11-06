"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { Disc3, Pause, Play } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { formatDuration } from "@/lib/utils";
import { GRID_METRICS } from "@/constants/playlistGrid";
import { useTranslation } from "react-i18next";

import type { GridCardProps } from "@/types/playlist/gridComponents";

export const GridCard = memo(function GridCard({
  track,
  cell,
  current,
  playing,
  register,
  onSelect,
  onPlay,
}: GridCardProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    register(cell, ref.current);
    return () => register(cell, null);
  }, [cell, register]);
  const artist = track.ar.map((item) => item.name).join(" / ");
  const cover = track.al.picUrl || track.al.coverUrl;
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={-1}
      data-grid-card=""
      data-centered="false"
      data-current={current}
      aria-label={t("playlist.grid.select", { name: track.name })}
      className="group/card absolute cursor-pointer text-foreground will-change-transform [contain:layout_paint] focus-visible:outline-none"
      style={{
        left: -GRID_METRICS.cardWidth / 2,
        top: -GRID_METRICS.cardHeight / 2,
        width: GRID_METRICS.cardWidth,
        height: GRID_METRICS.cardHeight,
        display: "none",
      }}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("button")) return;
        onSelect(cell, event.currentTarget.dataset.centered === "true");
      }}
    >
      <div className="flex size-full flex-col rounded-xl border border-border bg-card p-2.5 shadow-lg transition-shadow duration-300 group-hover/card:shadow-2xl group-data-[current=true]/card:ring-2 group-data-[current=true]/card:ring-primary group-data-[lights-off=true]/grid:not-group-data-[current=true]/card:brightness-50">
        <div className="relative aspect-square shrink-0 overflow-hidden rounded-lg bg-secondary">
          <Disc3
            className="absolute top-[24%] left-[24%] size-[52%] opacity-12"
            aria-hidden="true"
          />
          {cover && (
            <img
              src={getSizedImageUrl(cover, 400)}
              alt=""
              className="absolute inset-0 size-full object-cover"
              draggable={false}
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
          <button
            type="button"
            aria-label={`${t(playing ? "ui.pause" : "ui.play")} ${track.name}`}
            onClick={() => onPlay(track)}
            className="pointer-events-none absolute inset-0 m-auto grid size-14 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-200 group-data-[centered=true]/card:pointer-events-auto group-data-[centered=true]/card:opacity-100 group-data-[current=true]/card:pointer-events-auto group-data-[current=true]/card:opacity-100 hover:scale-105 hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-6"
          >
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
        </div>
        <div className="mt-2.5 flex min-h-0 min-w-0 flex-1 flex-col text-left">
          <strong
            className="line-clamp-2 text-[14px] leading-snug font-bold tracking-tight wrap-anywhere"
            title={track.name}
          >
            {track.name}
          </strong>
          <small
            className="mt-0.5 line-clamp-1 text-[12px] font-medium text-muted-foreground"
            title={artist || track.al.name}
          >
            {artist || track.al.name}
          </small>
          <span className="mt-auto flex items-center justify-between font-mono text-[10px] tabular-nums opacity-55">
            <span className="flex items-center gap-1.5">
              {String(cell.index + 1).padStart(2, "0")}
              {current && <span className="size-1.5 rounded-full bg-primary" />}
            </span>
            {formatDuration(track.dt)}
          </span>
        </div>
      </div>
    </div>
  );
});
