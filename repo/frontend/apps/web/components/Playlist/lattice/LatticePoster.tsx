"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Disc3, Pause, Play } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { LatticePosterProps } from "@/types/components/playlistLattice";
import styles from "./PlaylistLattice.module.css";

export const LatticePoster = memo(
  function LatticePoster({
    instance,
    rect,
    track,
    expanded,
    current,
    playing,
    focused,
    onFocus,
    onSelect,
    onPlay,
  }: LatticePosterProps) {
    const { t } = useI18n();
    const reducedMotion = useReducedMotion();
    const artist = track.ar.map((item) => item.name).join(" / ");
    const cover = track.al.picUrl || track.al.coverUrl;
    const playLabel = current && playing ? t("ui.pause") : t("ui.play");
    return (
      <motion.article
        className={styles.poster}
        data-instance={instance.instanceId}
        role={expanded ? "group" : "button"}
        tabIndex={focused ? 0 : -1}
        aria-label={t("playlist.lattice.select", { name: track.name })}
        aria-expanded={expanded}
        onFocus={(event) => {
          if (event.target === event.currentTarget) onFocus(instance);
        }}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("button, input")) return;
          if (!expanded) onSelect(instance);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!expanded) onSelect(instance);
            else if (event.key === "Enter") onPlay(track);
          }
        }}
        data-expanded={expanded}
        data-current={current}
        initial={false}
        animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.select}>
          <Disc3 className={styles.fallback} aria-hidden="true" />
          {cover && (
            <img
              src={
                cover.includes("music.126.net/")
                  ? `${cover}${cover.includes("?") ? "&" : "?"}param=${expanded ? 800 : 500}y${expanded ? 800 : 500}`
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
          <span className={styles.expandIcon}>
            <ArrowUpRight size={22} />
          </span>
          <span className={styles.copy}>
            <strong>{track.name}</strong>
            <small>{artist || track.al.name}</small>
          </span>
        </div>
        {expanded && (
          <div className={styles.posterControls}>
            <span className={styles.album}>{track.al.name}</span>
            <button
              type="button"
              onClick={() => onPlay(track)}
              aria-label={`${playLabel} ${track.name}`}
            >
              {current && playing ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
              {playLabel}
            </button>
          </div>
        )}
      </motion.article>
    );
  },
  (a, b) =>
    a.track === b.track &&
    a.instance.instanceId === b.instance.instanceId &&
    a.rect.x === b.rect.x &&
    a.rect.y === b.rect.y &&
    a.rect.width === b.rect.width &&
    a.rect.height === b.rect.height &&
    a.expanded === b.expanded &&
    a.current === b.current &&
    a.playing === b.playing &&
    a.focused === b.focused &&
    a.onFocus === b.onFocus &&
    a.onSelect === b.onSelect &&
    a.onPlay === b.onPlay,
);
