"use client";

import { useCallback, useEffect, useRef } from "react";
import { Move } from "lucide-react";
import { useLatticeWall } from "@/hooks/playlist/useLatticeWall";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
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
  const wall = useLatticeWall(tracks.length);
  const playback = usePlaybackProjection();
  const commands = usePlaybackCommands();
  const queueSource = usePlayerStore((state) => state.playlistId);
  const playFromSong = usePlayerStore((state) => state.playFromSong);
  const currentIndex =
    queueSource === sourceId ? tracks.findIndex((track) => track.id === playback.track?.id) : -1;
  const play = useCallback(
    (track: SongDetail) => {
      if (onTrackPlay) onTrackPlay(track);
      else if (queueSource === sourceId && track.id === playback.track?.id) void commands.toggle();
      else void playFromSong(track, tracks, sourceId);
    },
    [commands, onTrackPlay, playback.track?.id, playFromSong, queueSource, sourceId, tracks],
  );
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      className={styles.root}
      aria-label={t("playlist.lattice.open")}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <LatticeToolbar
        title={title}
        count={tracks.length}
        canLocate={currentIndex >= 0}
        onLocate={() => wall.locate(currentIndex)}
        onClose={onClose}
      />
      <div
        ref={wall.fieldRef}
        className={styles.field}
        {...wall.pointerHandlers}
        onClickCapture={(event) => {
          if (wall.didDrag.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          const dx = event.key === "ArrowLeft" ? 120 : event.key === "ArrowRight" ? -120 : 0;
          const dy = event.key === "ArrowUp" ? 120 : event.key === "ArrowDown" ? -120 : 0;
          if (!dx && !dy) return;
          event.preventDefault();
          event.stopPropagation();
          const current = wall.cameraRef.current;
          wall.move({ ...current, x: current.x + dx, y: current.y + dy });
        }}
      >
        <div
          className={styles.world}
          style={{
            transform: `translate3d(${wall.camera.x}px, ${wall.camera.y}px, 0) scale(${wall.camera.scale})`,
          }}
        >
          {wall.instances.map((instance) => {
            const track = tracks[instance.queueIndex];
            if (!track) return null;
            return (
              <LatticePoster
                key={`${instance.instanceId}:${track.id}`}
                instance={instance}
                track={track}
                rect={wall.layout?.get(instance.instanceId) ?? instance}
                expanded={wall.selected?.instanceId === instance.instanceId}
                current={instance.queueIndex === currentIndex}
                playing={playback.isPlaying}
                onSelect={wall.select}
                onPlay={play}
              />
            );
          })}
        </div>
      </div>
      {tracks.length === 0 && <div className={styles.empty}>{t("playlist.table.noSongs")}</div>}
      <div className={styles.hint}>
        <Move size={13} />
        <span>{t("playlist.lattice.hint")}</span>
      </div>
    </section>
  );
}
