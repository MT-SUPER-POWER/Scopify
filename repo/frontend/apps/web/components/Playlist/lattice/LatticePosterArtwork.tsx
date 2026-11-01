"use client";

import { ArrowUpRight, Disc3 } from "lucide-react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import type { LatticePosterArtworkProps } from "@/types/playlist/latticeComponents";

export function LatticePosterArtwork({
  track,
  instance,
  current,
  expanded,
}: LatticePosterArtworkProps) {
  const cover = track.al.picUrl || track.al.coverUrl;
  const size = expanded ? 800 : 500;
  return (
    <div className="absolute inset-0 size-full cursor-pointer border-0 p-0 text-left text-inherit">
      <Disc3
        className="absolute top-[24%] left-[24%] size-[52%] opacity-12"
        aria-hidden="true"
      />
      {cover && (
        <img
          src={getSizedImageUrl(cover, size)}
          alt=""
          className="absolute inset-0 size-full object-cover transition-[filter] duration-250 ease-[ease] group-hover/poster:saturate-106"
          draggable={false}
          decoding="async"
          onLoad={(event) => {
            event.currentTarget.style.visibility = "";
          }}
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      )}
      {/* The expanded current poster darkens further so the lyric canvas stays legible. */}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,#0001,transparent_30%,#0002_55%,#000b_100%)] group-data-[expanded=true]/poster:group-data-[current=true]/poster:bg-[linear-gradient(180deg,#0004,#0008_42%,#000b)]" />
      <span className="absolute top-[18px] left-5 flex items-center gap-[9px] px-1.5 py-1 text-[12px] font-semibold tracking-widest tabular-nums opacity-55 text-shadow-[0_1px_6px_#000] group-focus-within/poster:opacity-100 group-hover/poster:opacity-100">
        {String(instance.queueIndex + 1).padStart(2, "0")}
        {current && (
          <span className="size-[7px] rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
        )}
      </span>
      {!expanded && (
        <span className="absolute top-5 right-5 opacity-0 transition-opacity duration-200 ease-[ease] group-hover/poster:opacity-100">
          <ArrowUpRight size={22} />
        </span>
      )}
    </div>
  );
}
