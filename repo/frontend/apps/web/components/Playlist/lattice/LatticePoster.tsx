"use client";

import { lazy, memo, Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLatticeExpansionSettled } from "@/hooks/playlist/useLatticeExpansionSettled";
import { useTranslation } from "react-i18next";

import type { LatticePosterProps } from "@/types/playlist/latticeComponents";
import { LatticePosterArtwork } from "./LatticePosterArtwork";
import { LatticePlaybackControls } from "./LatticePlaybackControls";
import { posterCopyClass, posterSubtitleClass, posterTitleClass } from "./latticePosterCopy";

const LatticeLyrics = lazy(() => import("./LatticeLyrics"));

// Hover/focus lifts a tile above the expanded one (z-1); lights-off dims every tile except the
// current or expanded one. Plain :hover keeps the original touch behaviour.
const posterClass =
  "group/poster absolute top-0 left-0 overflow-hidden bg-secondary text-white transition-[filter] duration-300 ease-[ease] [contain:layout_paint] focus-visible:outline-4 focus-visible:-outline-offset-6 focus-visible:outline-white data-[expanded=true]:shadow-[0_24px_64px_#0006] data-[expanded=true]:[&:not(:hover,:focus-within)]:z-1 [&:hover,&:focus-within]:z-2 group-data-[lights-off=true]/lattice:not-data-[current=true]:not-data-[expanded=true]:brightness-28";

// Current-track frame drawn above the artwork and lyrics.
const currentFrameClass =
  "data-[current=true]:after:pointer-events-none data-[current=true]:after:absolute data-[current=true]:after:inset-0 data-[current=true]:after:z-2 data-[current=true]:after:border-2 data-[current=true]:after:border-primary";

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
    const { t } = useTranslation();
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
      <span className={posterCopyClass}>
        <strong className={posterTitleClass} title={track.name}>
          {track.name}
        </strong>
        <small className={posterSubtitleClass} title={artist || track.al.name}>
          {artist || track.al.name}
        </small>
      </span>
    );
    return (
      <motion.article
        className={cn(posterClass, currentFrameClass)}
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
        data-compact={!expanded && rect.width < 300}
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
