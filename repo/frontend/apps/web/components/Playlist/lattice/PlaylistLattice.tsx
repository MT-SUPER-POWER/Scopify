"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { useLatticeWall } from "@/hooks/playlist/useLatticeWall";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useLatticePreferences } from "@/store/module/lattice";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { SongDetail } from "@/types/api/music";
import type { PlaylistLatticeProps } from "@/types/components/playlistLattice";
import { LatticeToolbar } from "./LatticeToolbar";
import { LatticePoster } from "./LatticePoster";
import styles from "./PlaylistLattice.module.css";

export default function PlaylistLattice({
  tracks,
  title,
  sourceId,
  onTrackPlay,
  onClose,
}: PlaylistLatticeProps) {
  const { t } = useI18n();
  const rootRef = useRef<HTMLElement>(null);
  const hintId = useId();
  const wall = useLatticeWall(tracks.length);
  const followCurrent = useLatticePreferences((state) => state.followCurrent);
  const lightsOff = useLatticePreferences((state) => state.lightsOff);
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const queueSource = usePlayerStore((state) => state.playlistId);
  const playFromSong = usePlayerStore((state) => state.playFromSong);
  const currentIndex =
    queueSource === sourceId ? tracks.findIndex((track) => track.id === playback.track?.id) : -1;
  const play = useCallback(
    (track: SongDetail) => {
      if (queueSource === sourceId && track.id === playback.track?.id) void commands.toggle();
      else if (onTrackPlay) onTrackPlay(track);
      else void playFromSong(track, tracks, sourceId);
    },
    [commands, onTrackPlay, playback.track?.id, playFromSong, queueSource, sourceId, tracks],
  );
  useEffect(() => {
    wall.fieldRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (followCurrent && currentIndex >= 0) wall.locate(currentIndex);
  }, [followCurrent, currentIndex, wall.locate]);
  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      className={styles.root}
      data-lights-off={lightsOff && currentIndex >= 0}
      aria-label={t("playlist.lattice.open")}
      aria-describedby={hintId}
      onKeyDown={(event) => wall.onKeyDown(event, onClose)}
    >
      <LatticeToolbar
        title={title}
        count={tracks.length}
        canLocate={currentIndex >= 0}
        onLocate={() => wall.locate(currentIndex)}
        onClose={onClose}
      />
      <div ref={wall.fieldRef} className={styles.field} aria-label={title} tabIndex={0} {...wall.pointerHandlers}>
        <div ref={wall.worldRef} className={styles.world}>
          {wall.instances.map((instance) => {
            const track = tracks[instance.queueIndex];
            if (!track) return null;
            const rect = wall.layout?.get(instance.instanceId) ?? instance;
            return (
              <LatticePoster
                key={`${instance.instanceId}:${track.id}`}
                instance={instance}
                track={track}
                rect={rect}
                focused={wall.focused?.instanceId === instance.instanceId}
                onFocus={wall.focus}
                expanded={wall.selected?.instanceId === instance.instanceId}
                current={instance.queueIndex === currentIndex}
                onSelect={wall.select}
                onPlay={play}
              />
            );
          })}
        </div>
      </div>
      {tracks.length === 0 && <div className={styles.empty}>{t("playlist.table.noSongs")}</div>}
      <p id={hintId} className="sr-only">
        {t("playlist.lattice.hint")}
      </p>
    </section>
  );
}
