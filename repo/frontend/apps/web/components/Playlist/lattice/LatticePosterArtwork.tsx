"use client";

import { ArrowUpRight, Disc3 } from "lucide-react";
import type { LatticePosterArtworkProps } from "@/types/components/playlistLattice";
import styles from "./PlaylistLattice.module.css";

export function LatticePosterArtwork({
  track,
  instance,
  current,
  expanded,
}: LatticePosterArtworkProps) {
  const cover = track.al.picUrl || track.al.coverUrl;
  const size = expanded ? 800 : 500;
  return (
    <div className={styles.select}>
      <Disc3 className={styles.fallback} aria-hidden="true" />
      {cover && (
        <img
          src={
            cover.includes("music.126.net/")
              ? `${cover}${cover.includes("?") ? "&" : "?"}param=${size}y${size}`
              : cover
          }
          alt=""
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
      <span className={styles.shade} />
      <span className={styles.number}>
        {String(instance.queueIndex + 1).padStart(2, "0")}
        {current && <span className={styles.currentDot} />}
      </span>
      {!expanded && (
        <span className={styles.expandIcon}>
          <ArrowUpRight size={22} />
        </span>
      )}
    </div>
  );
}
