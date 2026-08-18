"use client";

import { useI18n } from "@/store/module/i18n";
import { cn } from "@/lib/utils";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaHarmonySettingsCardProps } from "@/types/components/lyrics";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";

interface HarmonyToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  theme: Theme;
}

function HarmonyToggle({ checked, label, onChange, theme }: HarmonyToggleProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 rounded-xl border px-3.5 py-3 text-left transition-[filter] hover:brightness-110"
      style={{
        backgroundColor: colorWithAlpha(theme.backgroundColor, 0.28),
        borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
      }}
      onClick={() => onChange(!checked)}
    >
      <span className="text-sm font-medium" style={{ color: theme.primaryColor }}>
        {label}
      </span>
      <span
        className="relative h-6 w-11 shrink-0 rounded-full border transition-colors"
        style={{
          backgroundColor: checked ? theme.accentColor : colorWithAlpha(theme.secondaryColor, 0.12),
          borderColor: checked ? theme.accentColor : colorWithAlpha(theme.secondaryColor, 0.2),
        }}
      >
        <span
          className="absolute top-[3px] size-4 rounded-full shadow-sm transition-transform"
          style={{
            backgroundColor: theme.backgroundColor,
            transform: "translateX(" + (checked ? 22 : 4) + "px)",
          }}
        />
      </span>
    </button>
  );
}

export function FoliaHarmonySettingsCard({
  className,
  controlCardBg,
  theme,
}: FoliaHarmonySettingsCardProps) {
  const { t } = useI18n();
  const showHarmonySubtitle = useLyricStageStore((state) => state.showHarmonySubtitle);
  const harmonySubtitleBackground = useLyricStageStore((state) => state.harmonySubtitleBackground);
  const patchSettings = useLyricStageStore((state) => state.patchSettings);

  return (
    <section
      className={cn("rounded-[24px] border p-4", className)}
      style={{
        backgroundColor: controlCardBg,
        borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
          {t("folia.options.harmonySettings")}
        </h3>
        <p className="mt-1 text-xs leading-5 opacity-70" style={{ color: theme.secondaryColor }}>
          {t("folia.options.harmonySettingsDesc")}
        </p>
      </div>
      <div className="space-y-2">
        <HarmonyToggle
          checked={showHarmonySubtitle}
          label={t("folia.options.showHarmonySubtitle")}
          onChange={(showHarmonySubtitle) => patchSettings({ showHarmonySubtitle })}
          theme={theme}
        />
        <HarmonyToggle
          checked={harmonySubtitleBackground}
          label={t("folia.options.harmonySubtitleBackground")}
          onChange={(harmonySubtitleBackground) => patchSettings({ harmonySubtitleBackground })}
          theme={theme}
        />
      </div>
    </section>
  );
}
