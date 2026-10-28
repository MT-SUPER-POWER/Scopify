"use client";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { FoliaSettingsSwitchProps } from "@/types/lyrics/components";

/** Compact on/off switch for Folia settings rows, painted from the stage theme. */
export function FoliaSettingsSwitch({ checked, label, onChange, theme }: FoliaSettingsSwitchProps) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className="relative h-6 w-11 shrink-0 rounded-full border transition-colors"
      onClick={() => onChange(!checked)}
      role="switch"
      style={{
        backgroundColor: checked ? theme.accentColor : colorWithAlpha(theme.secondaryColor, 0.12),
        borderColor: checked ? theme.accentColor : colorWithAlpha(theme.secondaryColor, 0.2),
      }}
      title={label}
      type="button"
    >
      <span
        className="absolute top-[3px] left-0 size-4 rounded-full shadow-sm transition-transform"
        style={{
          backgroundColor: theme.backgroundColor,
          transform: `translateX(${checked ? 22 : 4}px)`,
        }}
      />
    </button>
  );
}
