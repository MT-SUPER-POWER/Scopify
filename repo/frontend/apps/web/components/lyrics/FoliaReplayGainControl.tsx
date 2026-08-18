"use client";

import type { Theme } from "@/components/lyrics/folia/src/types";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";
import type { ReplayGainMode } from "@/types/player";

const MODES: ReplayGainMode[] = ["off", "track", "album"];

export function FoliaReplayGainControl({ theme }: { theme: Theme }) {
  const { t } = useI18n();
  const song = usePlayerStore((state) => state.currentSongDetail);
  const mode = usePlayerStore((state) => state.replayGainMode);
  const setMode = usePlayerStore((state) => state.setReplayGainMode);
  const isDaylight = theme.name === "snow";
  const trackGain = song?.replayGainTrackGain ?? song?.replayGain;
  const albumGain = song?.replayGainAlbumGain;
  const detectedGain = trackGain ?? albumGain;
  const detectedPrefix = trackGain != null ? "T" : "A";
  const modeLabels: Record<ReplayGainMode, string> = {
    album: t("folia.localMusic.replayGainAlbum"),
    off: t("folia.localMusic.replayGainOff"),
    track: t("folia.localMusic.replayGainTrack"),
  };

  return (
    <section
      className={`space-y-2 border-t pt-4 ${isDaylight ? "border-black/5" : "border-white/5"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase opacity-55">
          {t("audioSettings.replayGain")}
        </span>
        <span
          className="font-mono text-[10px] tabular-nums opacity-60"
          style={{ color: theme.secondaryColor }}
        >
          {detectedGain == null
            ? t("folia.localMusic.replayGainUnavailable")
            : `${detectedPrefix} ${detectedGain > 0 ? "+" : ""}${detectedGain.toFixed(1)} dB`}
        </span>
      </div>
      <div
        className={`grid grid-cols-3 gap-1 rounded-lg p-1 ${isDaylight ? "bg-black/5" : "bg-white/6"}`}
      >
        {MODES.map((option) => {
          const unavailable =
            (option === "track" && trackGain == null) || (option === "album" && albumGain == null);
          const active = mode === option;
          return (
            <button
              aria-pressed={active}
              className={`rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                active
                  ? isDaylight
                    ? "bg-white shadow-sm"
                    : "bg-white/14 shadow-sm"
                  : isDaylight
                    ? "hover:bg-white/70"
                    : "hover:bg-white/8"
              }`}
              disabled={unavailable}
              key={option}
              onClick={() => setMode(option)}
              style={{ color: active ? theme.accentColor : theme.primaryColor }}
              type="button"
            >
              {modeLabels[option]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
