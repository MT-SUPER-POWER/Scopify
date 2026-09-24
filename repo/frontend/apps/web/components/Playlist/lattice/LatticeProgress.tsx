"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPosition, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useI18n } from "@/store/module/i18n";
import type { LatticeProgressProps } from "@/types/components/playlistLattice";
import styles from "./LatticeControls.module.css";

const time = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export function LatticeProgress({ current, durationMs, trackId }: LatticeProgressProps) {
  const { t } = useI18n();
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPosition();
  const commands = usePlaybackCommands();
  const seekRevision = useRef(0);
  const [previewMs, setPreviewMs] = useState<number | null>(null);
  const duration = current ? playback.durationMs : durationMs;
  const enabled = current && playback.connection === "connected" && duration > 0;
  const position = Math.min(duration, previewMs ?? (current ? positionMs : 0));
  useEffect(() => {
    seekRevision.current++;
    setPreviewMs(null);
  }, [trackId, current]);
  const commit = async (value: number) => {
    if (!enabled || playback.track?.id !== trackId) return;
    const revision = ++seekRevision.current;
    setPreviewMs(value);
    try {
      await commands.seek(value);
    } finally {
      if (revision === seekRevision.current) setPreviewMs(null);
    }
  };
  return (
    <div className={styles.progress}>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1000}
        value={position}
        disabled={!enabled}
        aria-label={t("desktopPlaybackController.playbackProgress")}
        aria-valuetext={`${time(position)} / ${time(duration)}`}
        style={{ "--progress": `${duration ? (position / duration) * 100 : 0}%` } as CSSProperties}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onChange={(event) => setPreviewMs(Number(event.currentTarget.value))}
        onPointerUp={(event) => void commit(Number(event.currentTarget.value))}
        onPointerCancel={() => setPreviewMs(null)}
        onKeyUp={(event) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
              "PageUp",
              "PageDown",
            ].includes(event.key)
          )
            void commit(Number(event.currentTarget.value));
        }}
        onBlur={() => setPreviewMs(null)}
      />
      <div className={styles.time}>
        <span>{time(position)}</span>
        <span>{time(duration)}</span>
      </div>
    </div>
  );
}
