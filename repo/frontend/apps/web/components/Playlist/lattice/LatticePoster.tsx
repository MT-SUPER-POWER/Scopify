"use client";

import { lazy, memo, Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLatticeExpansionSettled } from "@/hooks/playlist/useLatticeExpansionSettled";
import { useI18n } from "@/store/module/i18n";
import type { LatticePosterProps } from "@/types/components/playlistLattice";
import { LatticePosterArtwork } from "./LatticePosterArtwork";
import { LatticePlaybackControls } from "./LatticePlaybackControls";
import styles from "./PlaylistLattice.module.css";

const LatticeLyrics = lazy(() => import("./LatticeLyrics"));

export const LatticePoster = memo(
  function LatticePoster({
    instance,
    rect,
    track,
    expanded,
    current,
    focused,
    onFocus,
    onSelect,
    onPlay,
  }: LatticePosterProps) {
    const { t } = useI18n();
    const reducedMotion = useReducedMotion();
    const [settled, onExpansionComplete] = useLatticeExpansionSettled(expanded, reducedMotion);
    const [revealed, setRevealed] = useState(false);
    const [focusWithin, setFocusWithin] = useState(false);
    const [hovered, setHovered] = useState(false);
    useEffect(() => {
      setRevealed(false);
    }, [expanded]);
    const artist = track.ar.map((item) => item.name).join(" / ");
    const copy = (
      <span className={styles.copy}>
        <strong>{track.name}</strong>
        <small>{artist || track.al.name}</small>
      </span>
    );
    return (
      <motion.article
        className={styles.poster}
        data-instance={instance.instanceId}
        role={expanded ? "group" : "button"}
        tabIndex={focused ? 0 : -1}
        aria-label={t("playlist.lattice.select", { name: track.name })}
        aria-expanded={expanded}
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
        }}
        onPointerDownCapture={() => setFocusWithin(false)}
        onFocus={(event) => {
          if (event.target === event.currentTarget) onFocus(instance);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("button, input")) return;
          if (!expanded) onSelect(instance);
          else setRevealed((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!expanded) onSelect(instance);
            else if (event.key === "Enter") onPlay(track);
            else setRevealed((value) => !value);
          }
        }}
        onAnimationComplete={onExpansionComplete}
        data-expanded={expanded}
        data-current={current}
        initial={false}
        animate={{
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          scaleX: !expanded && (hovered || focused) ? (rect.width + 8) / rect.width : 1,
          scaleY: !expanded && (hovered || focused) ? (rect.height + 8) / rect.height : 1,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <LatticePosterArtwork
          track={track}
          instance={instance}
          current={current}
          expanded={expanded}
        />
        {expanded && current && settled ? (
          <Suspense fallback={copy}>
            <LatticeLyrics track={track} />
          </Suspense>
        ) : (
          copy
        )}
        {expanded && (
          <LatticePlaybackControls
            track={track}
            current={current}
            revealed={revealed || hovered || focusWithin}
            onPlay={onPlay}
          />
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
    a.focused === b.focused &&
    a.onFocus === b.onFocus &&
    a.onSelect === b.onSelect &&
    a.onPlay === b.onPlay,
);
