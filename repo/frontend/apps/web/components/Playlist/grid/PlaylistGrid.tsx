"use client";

import { useCallback, useEffect, useId } from "react";
import { useGridWall } from "@/hooks/playlist/useGridWall";
import { usePlaylistViewPlayback } from "@/hooks/playlist/usePlaylistViewPlayback";
import { useLatticePreferences } from "@/store/module/lattice";
import { useTranslation } from "react-i18next";

import type { GridCell } from "@/types/playlist/grid";
import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";
import { LatticeToolbar } from "../lattice/LatticeToolbar";
import { GridCard } from "./GridCard";

export default function PlaylistGrid({
  tracks,
  title,
  sourceId,
  onTrackPlay,
  onClose,
  onModeChange,
}: PlaylistLatticeProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const wall = useGridWall(tracks.length);
  const { panTo, panToCell, fieldRef } = wall;
  const followCurrent = useLatticePreferences((state) => state.followCurrent);
  const lightsOff = useLatticePreferences((state) => state.lightsOff);
  const { currentIndex, isPlaying, play } = usePlaylistViewPlayback({
    tracks,
    sourceId,
    onTrackPlay,
  });
  const select = useCallback(
    (cell: GridCell, centered: boolean) => {
      const track = tracks[cell.index];
      if (!track) return;
      if (centered) play(track);
      else panToCell(cell);
    },
    [panToCell, play, tracks],
  );
  const activate = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (track) play(track);
    },
    [play, tracks],
  );
  useEffect(() => {
    fieldRef.current?.focus({ preventScroll: true });
  }, [fieldRef]);
  // Open on the playing track when it belongs to this page, otherwise on the first one.
  useEffect(() => {
    if (currentIndex >= 0) panTo(currentIndex);
    // Only on open; following is the preference below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (followCurrent && currentIndex >= 0) panTo(currentIndex);
  }, [followCurrent, currentIndex, panTo]);
  return (
    <section
      tabIndex={-1}
      className="group/grid @container absolute inset-0 isolate z-15 overflow-hidden bg-card text-foreground outline-none motion-reduce:**:transition-none"
      data-lights-off={lightsOff}
      aria-label={t("playlist.view.grid")}
      aria-describedby={hintId}
      onKeyDown={(event) => wall.onKeyDown(event, onClose, activate)}
    >
      <LatticeToolbar
        title={title}
        count={tracks.length}
        canLocate={currentIndex >= 0}
        onLocate={() => panTo(currentIndex)}
        onClose={onClose}
        mode="grid"
        onModeChange={onModeChange}
        hint={t("playlist.grid.hint")}
        onZoom={wall.zoomBy}
      />
      <div
        ref={fieldRef}
        className="absolute inset-0 cursor-grab touch-none overflow-clip overscroll-none outline-none select-none [perspective:1800px] data-[dragging=true]:cursor-grabbing data-[dragging=true]:**:cursor-grabbing"
        aria-label={title}
        tabIndex={0}
        {...wall.pointerHandlers}
      >
        <div
          ref={wall.worldRef}
          className="absolute inset-0 origin-top-left will-change-transform [transform-style:preserve-3d]"
        >
          {wall.visible.map((cell) => {
            const track = tracks[cell.index];
            if (!track) return null;
            return (
              <GridCard
                key={cell.key}
                track={track}
                cell={cell}
                current={cell.index === currentIndex}
                playing={cell.index === currentIndex && isPlaying}
                register={wall.register}
                onSelect={select}
                onPlay={play}
              />
            );
          })}
        </div>
      </div>
      {/* Vignette that sells the concave screen: the sides fall into shadow, the middle stays lit. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(ellipse_70%_75%_at_50%_50%,transparent_45%,color-mix(in_oklab,var(--card)_85%,transparent)_100%)]"
      />
      {tracks.length === 0 && (
        <div className="absolute inset-x-0 top-14 bottom-0 grid place-content-center text-muted-foreground">
          {t("playlist.table.noSongs")}
        </div>
      )}
      <p id={hintId} className="sr-only">
        {t("playlist.grid.hint")}
      </p>
    </section>
  );
}
