"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { usePlaylistViewPlayback } from "@/hooks/playlist/usePlaylistViewPlayback";
import { useRadioWallRail } from "@/hooks/playlist/useRadioWallRail";
import { useWallDoubleClick } from "@/hooks/playlist/useWallDoubleClick";
import {
  radioBrowseRange,
  radioTrackIndex,
  radioWallSlots,
  resolveRadioWallMetrics,
} from "@/lib/playlist/lattice/radioWall";
import { getLatticeTrackCopy } from "@/lib/playlist/lattice/trackCopy";
import { cn } from "@/lib/utils";
import { useLatticePreferences } from "@/store/module/lattice";
import { usePlayerStore } from "@/store/module/player";
import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";

import { LatticePlaybackControls } from "./LatticePlaybackControls";
import { PlaylistViewTools } from "./PlaylistViewTools";
import { RadioWallBackdrop } from "./RadioWallBackdrop";
import { RadioWallCard } from "./RadioWallCard";

const ENTRY_SETTLE_MS = 720;
const BROWSE_BUTTON_CLASS =
  "grid size-9 place-items-center rounded-full border border-white/15 bg-black/45 text-white shadow-sm hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-30 [&_svg]:size-5";

export default function RadioWall({
  tracks,
  title,
  sourceId,
  playbackQueue,
  onTrackPlay,
  onDislikeTrack,
  onClose,
  onModeChange,
}: PlaylistLatticeProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [entrySettled, setEntrySettled] = useState(false);
  const reducedMotion = useReducedMotion();
  const hideUpcoming = useLatticePreferences((state) => state.radioHideUpcoming);
  const currentNumberOnly = useLatticePreferences((state) => state.currentNumberOnly);
  const isFm = isPersonalFmPlaybackSource(sourceId);
  const wrap = usePlayerStore(
    (state) => !isFm && tracks === state.queue && !state.isShuffle && state.repeatMode === "all",
  );
  const { currentIndex, playAt } = usePlaylistViewPlayback({
    tracks,
    sourceId,
    onTrackPlay,
    playbackQueue,
  });
  const anchor = Math.max(0, currentIndex);
  const anchorTrack = tracks[anchor];
  const anchorKey = `${sourceId}:${currentIndex}:${anchorTrack ? getLatticeTrackCopy(anchorTrack).key : ""}`;
  const count = tracks.length;
  const range = useMemo(() => radioBrowseRange(count, anchor, wrap), [count, anchor, wrap]);
  const metrics = useMemo(
    () => resolveRadioWallMetrics(size.width, size.height),
    [size.width, size.height],
  );
  const navigation = useRadioWallRail({
    anchor,
    anchorKey,
    range,
    fieldRef,
    step: metrics.step,
    reducedMotion,
  });
  const { rail, visibleAt, selected, settled, dragging, select, nudge } = navigation;
  const selectedIndex = count > 0 ? radioTrackIndex(selected, count) : -1;
  const centeredTrack = tracks[selectedIndex];
  const concealsUpcoming = isFm || hideUpcoming;
  const isHidden = (position: number) => concealsUpcoming && currentIndex >= 0 && position > anchor;
  const doubleClick = useWallDoubleClick();
  const hint = t("playlist.radio.hint");
  const hasSize = size.width > 0 && size.height > 0;

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = field;
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(field);
    field.focus({ preventScroll: true });
    return () => observer.disconnect();
  }, []);

  // Cover decoding and entry animation get the first frames before the lyric canvas initializes.
  useEffect(() => {
    if (!hasSize || reducedMotion) return;
    const timer = window.setTimeout(() => setEntrySettled(true), ENTRY_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [hasSize, reducedMotion]);

  const renderReach = size.width < 560 ? 2 : size.width < 1000 ? 3 : 4;
  const slots = useMemo(
    () => (hasSize ? radioWallSlots(visibleAt, renderReach, count, range, isFm) : []),
    [hasSize, visibleAt, renderReach, count, range, isFm],
  );

  const locate = (position: number) => {
    select(position);
    fieldRef.current?.focus({ preventScroll: true });
  };
  const browse = (delta: number) => {
    nudge(delta);
    fieldRef.current?.focus({ preventScroll: true });
  };
  const cardTarget = (event: MouseEvent<HTMLDivElement>) =>
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>("[data-radio-position]")
      : null;

  return (
    <section
      data-playlist-view=""
      aria-label={t("playlist.view.radio")}
      aria-describedby={hintId}
      data-current-number-only={currentNumberOnly}
      className="group/radio @container absolute inset-0 isolate z-15 overflow-hidden bg-card text-foreground"
      onKeyDown={(event) => {
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          if (selected !== anchor) locate(anchor);
          else onClose();
          return;
        }
        if (!(event.target instanceof Node) || !fieldRef.current?.contains(event.target)) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          browse(event.key === "ArrowLeft" ? -1 : 1);
        } else if (event.key === "Enter" && event.target === fieldRef.current && centeredTrack) {
          event.preventDefault();
          event.stopPropagation();
          playAt(selectedIndex, true);
        }
      }}
    >
      <div
        ref={fieldRef}
        tabIndex={0}
        aria-label={title}
        role="group"
        data-dragging={dragging}
        className="absolute inset-0 touch-none overflow-clip overscroll-none outline-none select-none [-webkit-touch-callout:none] data-[dragging=true]:cursor-grabbing data-[dragging=true]:**:cursor-grabbing"
        {...navigation.pointerHandlers}
        onClickCapture={(event) => {
          navigation.cancelClickAfterDrag(event);
          doubleClick.note(
            event,
            settled && Number(cardTarget(event)?.dataset.radioPosition) === selected,
          );
        }}
        onClick={(event) => {
          const target = cardTarget(event);
          if (!target || event.detail > 1) return;
          const position = Number(target.dataset.radioPosition);
          if (position !== selected) locate(position);
          else if (event.detail === 0) playAt(Number(target.dataset.wallTrack), true);
        }}
        onDoubleClick={(event) => {
          const card = doubleClick.take(event);
          if (card && settled && Number(card.dataset.radioPosition) === selected)
            playAt(Number(card.dataset.wallTrack), true);
        }}
      >
        {hasSize && (
          <RadioWallBackdrop metrics={metrics} rail={rail} reducedMotion={reducedMotion} />
        )}
        {slots.map((slot) => {
          const track = slot.trackIndex === null ? null : (tracks[slot.trackIndex] ?? null);
          const current = slot.trackIndex === currentIndex;
          const centered = slot.position === selected;
          const faceDown = slot.trackIndex === null || isHidden(slot.position);
          return (
            <RadioWallCard
              key={`${slot.position}:${track ? getLatticeTrackCopy(track).key : "unknown"}`}
              slot={slot}
              metrics={metrics}
              rail={rail}
              track={track}
              centered={centered}
              current={current}
              faceDown={faceDown}
              showLyrics={Boolean(
                current &&
                centered &&
                settled &&
                (reducedMotion || entrySettled) &&
                metrics.cardSize >= 170,
              )}
            />
          );
        })}
      </div>

      {!tracks.length && !isFm && (
        <p className="pointer-events-none absolute inset-0 grid place-content-center text-content-muted">
          {t("playlist.table.noSongs")}
        </p>
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-4",
          playbackQueue && "pl-12",
        )}
      >
        <p dir="auto" className="min-w-0 truncate text-sm font-medium text-content">
          {title}
        </p>
        <div className="pointer-events-auto flex shrink-0 gap-1">
          <button
            type="button"
            aria-label={t("playlist.radio.browsePrevious")}
            disabled={selected <= range.min}
            className={BROWSE_BUTTON_CLASS}
            onClick={() => browse(-1)}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label={t("playlist.radio.browseNext")}
            disabled={selected >= range.max}
            className={BROWSE_BUTTON_CLASS}
            onClick={() => browse(1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {centeredTrack && !isHidden(selected) && (
        <LatticePlaybackControls
          track={centeredTrack}
          current={selectedIndex === currentIndex}
          revealed
          onPlay={() => playAt(selectedIndex)}
          onDislikeTrack={
            onDislikeTrack && selectedIndex === currentIndex
              ? () => onDislikeTrack(centeredTrack)
              : undefined
          }
          className="inset-x-3 bottom-3 mx-auto w-[min(520px,calc(100%-6rem))] rounded-xl bg-black/65 px-2 py-1.5 @max-[540px]:inset-x-3 @max-[540px]:bottom-20 @max-[540px]:w-auto [&_button]:size-9 @max-[540px]:[&_button]:size-8 [&_button_svg]:size-5"
        />
      )}
      {centeredTrack && isHidden(selected) && (
        <button
          type="button"
          className={cn(BROWSE_BUTTON_CLASS, "absolute bottom-6 left-1/2 z-20 -translate-x-1/2")}
          aria-label={t("ui.play")}
          onClick={() => playAt(selectedIndex, true)}
        >
          <Play fill="currentColor" />
        </button>
      )}
      <PlaylistViewTools
        revealing={false}
        title={title}
        count={count}
        mode="radio"
        onModeChange={onModeChange}
        hint={hint}
        canLocate={currentIndex >= 0}
        onLocate={() => locate(anchor)}
        onClose={onClose}
        tracks={isFm ? undefined : tracks}
        onLocateTrack={locate}
        isPersonalFm={isFm}
      />
      <p id={hintId} className="sr-only">
        {hint}
      </p>
    </section>
  );
}
