"use client";

import { memo } from "react";
import { Disc3, Pause, Play } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import type { BravaisTileProps } from "@/types/playlist/bravaisComponents";

export const BravaisTile = memo(function BravaisTile({
  seat,
  track,
  selected,
  current,
  playing,
  dimmed,
  onSelect,
  onPlay,
}: BravaisTileProps) {
  const { t } = useTranslation();
  const { instance } = seat;
  const style = {
    left: instance.x,
    top: instance.y,
    width: instance.width,
    height: instance.height,
  };
  const artist = track.ar.map((item) => item.name).join(" / ");
  const cover = track.al.picUrl || track.al.coverUrl;
  // Only the big poster of a block carries a title; the small ones stay plain album art.
  const roomy = instance.width >= 180;
  const titleSize = Math.max(16, Math.min(30, instance.width * 0.1));
  return (
    <div
      role="button"
      tabIndex={-1}
      data-bravais-tile=""
      data-selected={selected}
      data-current={current}
      aria-label={t("playlist.bravais.select", { name: track.name })}
      className={cn(
        // Square like every Lattice poster; the mark for the playing song is drawn inward over the art.
        "group/tile absolute cursor-pointer overflow-hidden bg-secondary text-white transition-[opacity,filter,box-shadow] duration-300 [contain:layout_paint]",
        "hover:z-2 hover:shadow-[0_12px_32px_#0008] hover:brightness-110",
        "data-[current=true]:after:pointer-events-none data-[current=true]:after:absolute data-[current=true]:after:inset-0 data-[current=true]:after:z-2 data-[current=true]:after:border-2 data-[current=true]:after:border-primary",
        "data-[selected=true]:z-1 data-[selected=true]:shadow-[0_24px_64px_#0008] data-[selected=true]:outline-4 data-[selected=true]:-outline-offset-6 data-[selected=true]:outline-white",
        dimmed && "opacity-15",
      )}
      style={style}
      onClick={() => onSelect(seat)}
      onDoubleClick={() => onPlay(track)}
    >
      <Disc3 className="absolute top-[24%] left-[24%] size-[52%] opacity-12" aria-hidden="true" />
      {cover && (
        <img
          src={getSizedImageUrl(cover, instance.width >= 300 ? 600 : 300)}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
          decoding="async"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      )}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,#0001,transparent_30%,#0002_55%,#000b_100%)]" />
      <span className="absolute top-2.5 left-3 flex items-center gap-2 text-[11px] font-semibold tracking-widest tabular-nums opacity-60 text-shadow-[0_1px_6px_#000] group-hover/tile:opacity-100">
        {String(instance.queueIndex + 1).padStart(2, "0")}
        {current && (
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        )}
      </span>
      {roomy && (
        <span className="absolute inset-x-3 bottom-3 flex flex-col gap-1">
          <strong
            className="leading-1.12 line-clamp-2 font-bold tracking-[-0.02em] text-balance wrap-anywhere"
            style={{ fontSize: titleSize }}
            title={track.name}
          >
            {track.name}
          </strong>
          <small
            className="leading-1.35 truncate font-medium opacity-72"
            style={{ fontSize: Math.max(11, titleSize * 0.48) }}
            title={artist || track.al.name}
          >
            {artist || track.al.name}
          </small>
        </span>
      )}
      <button
        type="button"
        aria-label={`${t(playing ? "ui.pause" : "ui.play")} ${track.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onPlay(track);
        }}
        className="absolute top-2 right-2 z-3 grid size-8 place-items-center rounded-full bg-black/55 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/tile:opacity-100 group-data-[current=true]/tile:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-4"
      >
        {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
      </button>
    </div>
  );
});
