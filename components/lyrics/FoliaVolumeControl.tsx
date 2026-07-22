"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Theme } from "@/components/lyrics/folia/src/types";

interface FoliaVolumeControlProps {
  onChange: (volume: number) => void;
  onToggleMute: () => void;
  theme: Theme;
  volume: number;
}

/** Folia ControlsTab-compatible volume well for the lyric-stage side panel. */
export function FoliaVolumeControl({
  onChange,
  onToggleMute,
  theme,
  volume,
}: FoliaVolumeControlProps) {
  const { t } = useTranslation();
  const isDaylight = theme.name === "snow";
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <section className="pt-2">
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-widest uppercase opacity-40"
          style={{ color: theme.primaryColor }}
        >
          {t("ui.volume")}
        </span>
        <span className="text-[10px] font-bold opacity-60" style={{ color: theme.primaryColor }}>
          {Math.round(volume)}%
        </span>
      </div>
      <div
        className={`flex items-center gap-3 rounded-xl p-2 ${isDaylight ? "bg-black/5" : "bg-black/20"}`}
      >
        <button
          type="button"
          title={String(t("ui.mute"))}
          aria-label={String(t("ui.mute"))}
          onClick={onToggleMute}
          className="opacity-40 transition-opacity hover:opacity-100"
          style={{ color: theme.primaryColor }}
        >
          <VolumeIcon size={16} />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume}
          onInput={(event) => onChange(Number(event.currentTarget.value))}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          className={`h-1 flex-1 cursor-pointer appearance-none rounded-full ${
            isDaylight ? "bg-black/10" : "bg-white/10"
          }`}
          style={{ accentColor: theme.primaryColor }}
        />
      </div>
    </section>
  );
}
