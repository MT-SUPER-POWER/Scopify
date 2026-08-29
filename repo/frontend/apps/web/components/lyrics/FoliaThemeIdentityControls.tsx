"use client";

import { Moon, Sun, Trash2 } from "lucide-react";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { getFoliaThemeColors } from "@scopify/ui/folia";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeIdentityControlsProps } from "@/types/components/lyrics";

export function FoliaThemeIdentityControls({
  draftTheme,
  onDeleteTheme,
  onDraftChange,
}: FoliaThemeIdentityControlsProps) {
  const { t } = useI18n();
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const setThemeVariant = useLyricStageStore((state) => state.setThemeVariant);
  const activeColors = getFoliaThemeColors(draftTheme, themeVariant);

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/4.5 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-50">
            {t("folia.options.themeName")}
          </span>
          <input
            className="w-full border-b border-white/15 bg-transparent pb-1 text-base font-semibold transition outline-none focus:border-white/50"
            onChange={(event) => onDraftChange({ ...draftTheme, name: event.target.value })}
            value={draftTheme.name}
          />
        </label>
        <button
          aria-label={String(t("folia.options.deleteTheme"))}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-rose-400 transition hover:bg-rose-500/10"
          onClick={onDeleteTheme}
          title={String(t("folia.options.deleteTheme"))}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div
        className="flex rounded-xl p-1"
        style={{ backgroundColor: colorWithAlpha(activeColors.backgroundColor, 0.5) }}
      >
        {(
          [
            ["light", Sun, "folia.options.lightTheme"],
            ["dark", Moon, "folia.options.darkTheme"],
          ] as const
        ).map(([variant, Icon, label]) => {
          const active = themeVariant === variant;
          return (
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-xs transition-all"
              key={variant}
              onClick={() => setThemeVariant(variant)}
              style={{
                backgroundColor: active
                  ? colorWithAlpha(activeColors.accentColor, 0.15)
                  : "transparent",
                borderColor: active ? colorWithAlpha(activeColors.accentColor, 0.5) : "transparent",
                color: active ? activeColors.primaryColor : `${activeColors.secondaryColor}99`,
              }}
              type="button"
            >
              <Icon size={14} />
              {t(label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
