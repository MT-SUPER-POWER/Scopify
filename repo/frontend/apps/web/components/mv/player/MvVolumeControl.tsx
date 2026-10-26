"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { MvVolumeControlProps } from "@/types/components/mv";

const CONTROL_BTN =
  "flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15";

/** 音量：点击图标静音，悬停时向右展开滑块（同 YouTube）。 */
export function MvVolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: MvVolumeControlProps) {
  const { t } = useI18n();
  const level = isMuted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className="group/volume flex items-center">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={t(isMuted ? "mv.player.unmute" : "mv.player.mute")}
        className={CONTROL_BTN}
      >
        <Icon className="size-5" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={level}
        aria-label={t("mv.player.volume")}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 accent-white opacity-0 transition-all duration-200 group-hover/volume:ml-1 group-hover/volume:w-16 group-hover/volume:opacity-100 focus-visible:ml-1 focus-visible:w-16 focus-visible:opacity-100"
        style={{
          background: `linear-gradient(to right, white ${level * 100}%, rgb(255 255 255 / 0.3) ${level * 100}%)`,
        }}
      />
    </div>
  );
}
