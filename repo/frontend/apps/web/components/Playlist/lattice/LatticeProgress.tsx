"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { usePlaybackPosition, usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import { useProgressChorusMarker } from "@/hooks/player/useProgressChorusMarker";
import { useTranslation } from "react-i18next";

import type { LatticeProgressProps } from "@/types/playlist/latticeComponents";

const time = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export function LatticeProgress({ current, durationMs, trackId }: LatticeProgressProps) {
  const { t } = useTranslation();
  const playback = usePlaybackProjection();
  const positionMs = usePlaybackPosition(current);
  const commands = usePlaybackCommands();
  const seekRevision = useRef(0);
  const [previewMs, setPreviewMs] = useState<number | null>(null);
  const duration = current ? playback.durationMs : durationMs;
  const enabled = current && playback.connection === "connected" && duration > 0;
  const position = Math.min(duration, previewMs ?? (current ? positionMs : 0));
  const progress = duration ? (position / duration) * 100 : 0;
  const { chorusMarkerFraction } = useProgressChorusMarker({
    durationMs: duration,
    enabled: current,
    songId: trackId,
  });
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
    <div className="mt-4">
      <div className="relative flex items-center">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1000}
          value={position}
          disabled={!enabled}
          aria-label={t("desktopPlaybackController.playbackProgress")}
          aria-valuetext={`${time(position)} / ${time(duration)}`}
          className="m-0 block h-5 w-full cursor-pointer touch-none appearance-none bg-transparent outline-offset-6 disabled:cursor-default disabled:opacity-40 [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-(image:--track) [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-(image:--track) [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          style={
            {
              "--track": `linear-gradient(to right, #fff ${progress}%, #ffffff38 ${progress}%)`,
            } as CSSProperties
          }
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
        {chorusMarkerFraction !== null && (
          <span
            aria-hidden
            data-chorus-marker=""
            className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55"
            style={{ left: `${(chorusMarkerFraction * 100).toFixed(3)}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[17px] tabular-nums opacity-58">
        <span>{time(position)}</span>
        <span>{time(duration)}</span>
      </div>
    </div>
  );
}
