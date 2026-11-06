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
  const roomy = instance.width >= 190 && instance.height >= 120;
  return (
    <div
      role="button"
      tabIndex={-1}
      data-bravais-tile=""
      data-side={seat.side}
      data-selected={selected}
      data-current={current}
      aria-label={t("playlist.bravais.select", { name: track.name })}
      className={cn(
        "group/tile absolute cursor-pointer overflow-hidden rounded-md bg-secondary text-white transition-[opacity,filter,box-shadow] duration-300 [contain:layout_paint]",
        "data-[side=left]:[translate:var(--seam-l,0px)_0] data-[side=right]:[translate:var(--seam-r,0px)_0]",
        "hover:z-1 hover:shadow-xl hover:brightness-110",
        "data-[current=true]:ring-2 data-[current=true]:ring-primary data-[selected=true]:z-1 data-[selected=true]:outline-2 data-[selected=true]:-outline-offset-2 data-[selected=true]:outline-white",
        dimmed && "opacity-15",
      )}
      style={style}
      onClick={() => onSelect(instance)}
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
      <span className="absolute inset-0 bg-[linear-gradient(180deg,#0001,transparent_35%,#0009_100%)]" />
      <span className="absolute top-2 left-2.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-widest tabular-nums opacity-70 text-shadow-[0_1px_4px_#000]">
        {String(seat.trackIndex + 1).padStart(2, "0")}
        {current && (
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        )}
      </span>
      {roomy && (
        <span className="absolute inset-x-2.5 bottom-2 flex flex-col">
          <strong className="line-clamp-2 text-[13px] leading-tight font-bold" title={track.name}>
            {track.name}
          </strong>
          <small className="truncate text-[11px] opacity-75" title={artist || track.al.name}>
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
        className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-black/55 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/tile:opacity-100 group-data-[current=true]/tile:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-4"
      >
        {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
      </button>
    </div>
  );
});
