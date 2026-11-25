"use client";

import { useEffect, useId, useRef } from "react";
import { useFlipReveal } from "@/hooks/playlist/useFlipReveal";
import { useLatticeWall } from "@/hooks/playlist/useLatticeWall";
import { usePlaylistViewPlayback } from "@/hooks/playlist/usePlaylistViewPlayback";
import { useWallDoubleClick } from "@/hooks/playlist/useWallDoubleClick";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { overlaps, toBounds } from "@/lib/playlist/lattice/layout";
import { useLatticePreferences } from "@/store/module/lattice";
import { useTranslation } from "react-i18next";

import type { PlaylistLatticeProps } from "@/types/playlist/latticeComponents";
import { PlaylistViewTools } from "./PlaylistViewTools";
import { LatticePoster } from "./LatticePoster";

export default function PlaylistLattice({
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
  const rootRef = useRef<HTMLElement>(null);
  const hintId = useId();
  const wall = useLatticeWall(tracks.length);
  const followCurrent = useLatticePreferences((state) => state.followCurrent);
  const lightsOff = useLatticePreferences((state) => state.lightsOff);
  const currentNumberOnly = useLatticePreferences((state) => state.currentNumberOnly);
  const { currentIndex, playAt } = usePlaylistViewPlayback({
    tracks,
    sourceId,
    onTrackPlay,
    playbackQueue,
  });
  const doubleClick = useWallDoubleClick();
  const { bounds, locate } = wall;
  const flip = useFlipReveal(wall.fieldRef, wall.instances, tracks.length > 0, (instance) => {
    if (!overlaps(toBounds(instance), bounds)) return null;
    const radius = Math.hypot(bounds.right - bounds.left, bounds.bottom - bounds.top) / 2;
    return {
      key: instance.instanceId,
      distance:
        Math.hypot(
          instance.x + instance.width / 2 - (bounds.left + bounds.right) / 2,
          instance.y + instance.height / 2 - (bounds.top + bounds.bottom) / 2,
        ) / radius,
    };
  });
  useEffect(() => {
    wall.fieldRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Waits for the flip: the camera flying off mid-turn would drag half-turned cards out of view.
  useEffect(() => {
    if (flip.settled && followCurrent && currentIndex >= 0) locate(currentIndex);
  }, [flip.settled, followCurrent, currentIndex, locate]);
  return (
    <section
      data-playlist-view=""
      ref={rootRef}
      tabIndex={-1}
      className="group/lattice @container absolute inset-0 isolate z-15 overflow-hidden bg-card text-foreground transition-[box-shadow] duration-[260ms] ease-out outline-none data-[lights-off=true]:shadow-[inset_0_0_0_100vmax_rgb(0_0_0/92%)] motion-reduce:transition-none motion-reduce:**:transition-none"
      data-lights-off={lightsOff && currentIndex >= 0}
      data-current-number-only={currentNumberOnly}
      aria-label={t("playlist.view.lattice")}
      aria-describedby={hintId}
      onKeyDown={(event) => wall.onKeyDown(event, onClose)}
    >
      <PlaylistViewTools
        revealing={flip.toolsFade}
        title={title}
        count={tracks.length}
        canLocate={currentIndex >= 0}
        onLocate={() => wall.locate(currentIndex)}
        onClose={onClose}
        mode="lattice"
        onModeChange={onModeChange}
        hint={t("playlist.lattice.hint")}
        onZoom={wall.zoomBy}
        tracks={tracks}
        onLocateTrack={(index) => {
          wall.locate(index);
          wall.fieldRef.current?.focus({ preventScroll: true });
        }}
      />
      <div
        ref={wall.fieldRef}
        className="absolute inset-0 cursor-grab touch-none overflow-clip overscroll-none outline-none select-none data-[dragging=true]:cursor-grabbing data-[dragging=true]:**:cursor-grabbing"
        aria-label={title}
        tabIndex={0}
        {...wall.pointerHandlers}
        onClickCapture={(event) => {
          wall.pointerHandlers.onClickCapture(event);
          doubleClick.note(event);
        }}
        onDoubleClick={(event) => {
          const poster = doubleClick.take(event);
          if (!poster) return;
          playAt(Number(poster.dataset.wallTrack), true);
        }}
      >
        <div ref={wall.worldRef} className="absolute inset-0 origin-top-left will-change-transform">
          {wall.instances.map((instance) => {
            const track = tracks[instance.queueIndex];
            if (!track) return null;
            const rect = wall.layout?.get(instance.instanceId) ?? instance;
            return (
              <LatticePoster
                key={`${instance.instanceId}:${playerTrackKey(track)}`}
                instance={instance}
                track={track}
                rect={rect}
                focused={wall.focused?.instanceId === instance.instanceId}
                onFocus={wall.focus}
                expanded={wall.selected?.instanceId === instance.instanceId}
                current={instance.queueIndex === currentIndex}
                onSelect={wall.select}
                onPlay={playAt}
                onDislikeTrack={onDislikeTrack}
                flipPlan={flip.plan}
              />
            );
          })}
        </div>
      </div>
      {tracks.length === 0 && (
        <div className="absolute inset-x-0 top-14 bottom-0 grid place-content-center text-muted-foreground">
          {t("playlist.table.noSongs")}
        </div>
      )}
      <p id={hintId} className="sr-only">
        {t("playlist.lattice.hint")}
      </p>
    </section>
  );
}
