import type { CSSProperties } from "react";

import { DEFAULT_RHINE_BACKGROUND_TUNING } from "@/constants/rhineBackground";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { VisualizerBackgroundSettingsProps } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";

export default function RhineBackgroundSettingsCard({
  config,
  actions,
  t,
  isDaylight,
  theme,
  controlCardBg,
  rangeInputClass,
  onSliderPointerDown,
  onSliderCommit,
}: VisualizerBackgroundSettingsProps) {
  const tuning = { ...DEFAULT_RHINE_BACKGROUND_TUNING, ...config?.rhine?.tuning };
  const change = actions?.rhine?.onTuningChange;
  const selectClass = "min-w-32 rounded-lg border px-3 py-2 text-sm outline-none";
  // Native popups ignore the card's inherited color, so pin the field and options to the Folia theme.
  const selectStyle: CSSProperties = {
    color: theme.primaryColor,
    backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.6 : 0.72),
    borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.24 : 0.2),
  };
  const optionStyle: CSSProperties = {
    color: theme.primaryColor,
    backgroundColor: theme.backgroundColor,
  };

  return (
    <div
      className="space-y-5 rounded-3xl border border-current/15 p-4"
      style={{
        backgroundColor: controlCardBg,
        color: theme.primaryColor,
        colorScheme: isDaylight ? "light" : "dark",
        accentColor: theme.accentColor,
      }}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{t("folia.rhine.title")}</h3>
        <p className="text-xs opacity-70">{t("folia.rhine.description")}</p>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.colorMode")}</span>
        <select
          className={selectClass}
          style={selectStyle}
          value={tuning.colorMode}
          onChange={(event) => {
            const colorMode = event.target.value;
            if (colorMode === "auto" || colorMode === "light" || colorMode === "dark")
              change?.({ colorMode });
          }}
        >
          <option style={optionStyle} value="auto">
            {t("folia.rhine.colorAuto")}
          </option>
          <option style={optionStyle} value="light">
            {t("folia.rhine.colorLight")}
          </option>
          <option style={optionStyle} value="dark">
            {t("folia.rhine.colorDark")}
          </option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.musicEnabled")}</span>
        <input
          type="checkbox"
          checked={tuning.musicEnabled}
          onChange={(event) => change?.({ musicEnabled: event.target.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.breathingEnabled")}</span>
        <input
          type="checkbox"
          checked={tuning.breathingEnabled}
          onChange={(event) => change?.({ breathingEnabled: event.target.checked })}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.rhythmStyle")}</span>
        <select
          className={selectClass}
          style={selectStyle}
          value={tuning.rhythmStyle}
          onChange={(event) => {
            const rhythmStyle = event.target.value;
            if (rhythmStyle === "legacy" || rhythmStyle === "wave" || rhythmStyle === "lift")
              change?.({ rhythmStyle });
          }}
        >
          <option style={optionStyle} value="legacy">
            {t("folia.rhine.rhythmLegacy")}
          </option>
          <option style={optionStyle} value="wave">
            {t("folia.rhine.rhythmWave")}
          </option>
          <option style={optionStyle} value="lift">
            {t("folia.rhine.rhythmLift")}
          </option>
        </select>
      </label>
      <label className="block space-y-2 text-sm">
        <span className="flex justify-between">
          <span>{t("folia.rhine.strength")}</span>
          <span>{tuning.strength.toFixed(2)}</span>
        </span>
        <input
          className={rangeInputClass}
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={tuning.strength}
          onChange={(event) => change?.({ strength: Number(event.target.value) })}
          onPointerDown={onSliderPointerDown}
          onPointerUp={onSliderCommit}
          onPointerCancel={onSliderCommit}
          onKeyUp={onSliderCommit}
          onBlur={onSliderCommit}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="flex justify-between">
          <span>{t("folia.rhine.overlayOpacity")}</span>
          <span>{Math.round(tuning.overlayOpacity * 100)}%</span>
        </span>
        <input
          className={rangeInputClass}
          type="range"
          min="0"
          max="0.85"
          step="0.05"
          value={tuning.overlayOpacity}
          onChange={(event) => change?.({ overlayOpacity: Number(event.target.value) })}
          onPointerDown={onSliderPointerDown}
          onPointerUp={onSliderCommit}
          onPointerCancel={onSliderCommit}
          onKeyUp={onSliderCommit}
          onBlur={onSliderCommit}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.quality")}</span>
        <select
          className={selectClass}
          style={selectStyle}
          value={tuning.quality}
          onChange={(event) => {
            const quality = event.target.value;
            if (quality === "performance" || quality === "original" || quality === "high")
              change?.({ quality });
          }}
        >
          <option style={optionStyle} value="performance">
            {t("folia.rhine.qualityPerformance")}
          </option>
          <option style={optionStyle} value="original">
            {t("folia.rhine.qualityOriginal")}
          </option>
          <option style={optionStyle} value="high">
            {t("folia.rhine.qualityHigh")}
          </option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>{t("folia.rhine.frameRate")}</span>
        <select
          className={selectClass}
          style={selectStyle}
          value={tuning.frameRate}
          onChange={(event) => {
            const frameRate = event.target.value;
            if (frameRate === "30" || frameRate === "60") change?.({ frameRate });
          }}
        >
          <option style={optionStyle} value="30">
            30 FPS
          </option>
          <option style={optionStyle} value="60">
            60 FPS
          </option>
        </select>
      </label>
      <p className="text-xs opacity-60">{t("folia.rhine.pauseHint")}</p>
    </div>
  );
}
