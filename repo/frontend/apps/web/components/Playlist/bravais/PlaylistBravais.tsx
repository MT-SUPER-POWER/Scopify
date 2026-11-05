"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useBravaisWall } from "@/hooks/playlist/useBravaisWall";
import { usePlaylistViewPlayback } from "@/hooks/playlist/usePlaylistViewPlayback";
import { matchesTrackFilter } from "@/lib/playlist/bravais/wall";
import { useLatticePreferences } from "@/store/module/lattice";
import { useTranslation } from "react-i18next";

import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";
import { LatticeToolbar } from "../lattice/LatticeToolbar";
import { BravaisSeam } from "./BravaisSeam";
import { BravaisTile } from "./BravaisTile";

export default function PlaylistBravais({
  tracks,
  title,
  sourceId,
  onTrackPlay,
  onClose,
  onModeChange,
}: PlaylistLatticeProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const wall = useBravaisWall(tracks.length);
  const { fieldRef, select, selectedIndex } = wall;
  const followCurrent = useLatticePreferences((state) => state.followCurrent);
  const lightsOff = useLatticePreferences((state) => state.lightsOff);
  const { currentIndex, isPlaying, play } = usePlaylistViewPlayback({
    tracks,
    sourceId,
    onTrackPlay,
  });
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const result: number[] = [];
    tracks.forEach((track, index) => {
      if (matchesTrackFilter(track, query.trim())) result.push(index);
    });
    return result;
  }, [tracks, query]);
  const matchSet = useMemo(() => new Set(matches), [matches]);
  const filtering = query.trim() !== "" && matches.length !== tracks.length;
  const selectTrack = useCallback((index: number) => select(index), [select]);
  useEffect(() => {
    fieldRef.current?.focus({ preventScroll: true });
  }, [fieldRef]);
  useEffect(() => {
    if (currentIndex >= 0) select(currentIndex);
    // Only on open; following is the preference below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (followCurrent && currentIndex >= 0) select(currentIndex);
  }, [followCurrent, currentIndex, select]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (selectedIndex !== null) select(null);
      else onClose();
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest('button, input, [role="button"], [role="menu"]')
    )
      return;
    if (event.key === "Enter" && selectedIndex !== null) {
      event.preventDefault();
      const track = tracks[selectedIndex];
      if (track) play(track);
      return;
    }
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const position = selectedIndex === null ? -1 : matches.indexOf(selectedIndex);
    const next = matches[Math.min(matches.length - 1, Math.max(0, position + (forward ? 1 : -1)))];
    if (next !== undefined) select(next);
  };
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="group/bravais @container absolute inset-0 isolate z-15 overflow-hidden bg-card text-foreground outline-none motion-reduce:**:transition-none"
      data-lights-off={lightsOff && currentIndex >= 0}
      aria-label={t("playlist.view.bravais")}
      aria-describedby={hintId}
      onKeyDown={onKeyDown}
    >
      <LatticeToolbar
        title={title}
        count={tracks.length}
        canLocate={currentIndex >= 0}
        onLocate={() => select(currentIndex)}
        onClose={onClose}
        mode="bravais"
        onModeChange={onModeChange}
        hint={t("playlist.bravais.hint")}
      />
      <div
        ref={fieldRef}
        className="absolute inset-0 cursor-grab touch-none overflow-clip overscroll-none outline-none select-none data-[dragging=true]:cursor-grabbing data-[dragging=true]:**:cursor-grabbing"
        aria-label={title}
        tabIndex={0}
        {...wall.pointerHandlers}
      >
        <div ref={wall.worldRef} className="absolute inset-0 origin-top-left will-change-transform">
          {wall.visible.map((seat) => {
            const track = seat.trackIndex >= 0 ? tracks[seat.trackIndex] : undefined;
            const current = track !== undefined && seat.trackIndex === currentIndex;
            return (
              <BravaisTile
                key={seat.instance.instanceId}
                seat={seat}
                track={track}
                selected={seat.trackIndex === selectedIndex}
                current={current}
                playing={current && isPlaying}
                dimmed={
                  (filtering && !matchSet.has(seat.trackIndex)) ||
                  (lightsOff && currentIndex >= 0 && !current)
                }
                onSelect={selectTrack}
                onPlay={play}
              />
            );
          })}
        </div>
        <div ref={wall.panelRef} className="absolute top-0 left-0 h-full w-0">
          <BravaisSeam
            title={title}
            tracks={tracks}
            contentWidth={wall.seamWidth}
            query={query}
            onQueryChange={setQuery}
            matches={matches}
            selectedIndex={selectedIndex}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            onSelect={selectTrack}
            onPlay={play}
          />
        </div>
      </div>
      {tracks.length === 0 && (
        <div className="absolute inset-x-0 top-14 bottom-0 grid place-content-center text-muted-foreground">
          {t("playlist.table.noSongs")}
        </div>
      )}
      <p id={hintId} className="sr-only">
        {t("playlist.bravais.hint")}
      </p>
    </section>
  );
}
