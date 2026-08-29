"use client";

import { RadioTower } from "lucide-react";

import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import type { Theme } from "@/components/lyrics/folia/src/types";
import {
  getPersonalFmSelectionLabel,
  PERSONAL_FM_MODES,
  PERSONAL_FM_SCENE_CATEGORY_LABELS,
  PERSONAL_FM_SCENES,
} from "@/constants/personalFm";
import { useI18n } from "@/store/module/i18n";
import { useHorizontalDragScroll } from "@/hooks/ui/useHorizontalDragScroll";
import { usePersonalFmStore } from "@/store/module/personalFm";
import type { PersonalFmModeId, PersonalFmSceneCategory } from "@/types/personalFm";

interface FoliaPersonalFmModeMatrixProps {
  compact?: boolean;
  theme: Theme;
}

const SCENE_CATEGORIES: readonly PersonalFmSceneCategory[] = [
  "mood",
  "activity",
  "genre",
  "language",
];

export function FoliaPersonalFmModeMatrix({
  compact = false,
  theme,
}: FoliaPersonalFmModeMatrixProps) {
  const { t } = useI18n();
  const selection = usePersonalFmStore((state) => state.selection);
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const selectionLabel = getPersonalFmSelectionLabel(selection, t);
  const horizontalScroll = useHorizontalDragScroll();
  const isDaylight = theme.name === "snow";

  const selectMode = (mode: PersonalFmModeId) =>
    usePersonalFmStore.getState().setSelection({
      mode,
      scene: mode === "SCENE_RCMD" ? (selection.scene ?? "FOCUS") : null,
    });

  const getButtonStyle = (active: boolean) => ({
    backgroundColor: active
      ? colorWithAlpha(isDaylight ? theme.backgroundColor : theme.primaryColor, 0.96)
      : "transparent",
    boxShadow: active ? `0 2px 7px ${colorWithAlpha(theme.primaryColor, 0.16)}` : "none",
    color: active ? theme.accentColor : theme.primaryColor,
  });

  const trackStyle = {
    backgroundColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.1 : 0.14),
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {compact ? (
        <div className="flex justify-start px-0.5">
          <span
            role="status"
            className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: colorWithAlpha(theme.accentColor, 0.12),
              color: theme.primaryColor,
            }}
          >
            <RadioTower
              className={isLoading ? "size-3.5 shrink-0 animate-pulse" : "size-3.5 shrink-0"}
            />
            <span className="truncate">{selectionLabel}</span>
          </span>
        </div>
      ) : (
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: colorWithAlpha(theme.accentColor, 0.12),
                color: theme.accentColor,
              }}
            >
              <RadioTower className={isLoading ? "size-4 animate-pulse" : "size-4"} />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
                {t("personalFm.settings.title")}
              </h3>
              <p className="mt-0.5 text-[11px] opacity-50" style={{ color: theme.secondaryColor }}>
                {isLoading ? t("personalFm.status.loading") : t("personalFm.settings.description")}
              </p>
            </div>
          </div>
          <span
            className="min-w-0 truncate text-xs font-semibold"
            style={{ color: theme.primaryColor }}
          >
            {selectionLabel}
          </span>
        </header>
      )}

      <div className={compact ? "space-y-2.5 text-xs" : "space-y-3 text-xs"}>
        <section className="space-y-1.5">
          <span className="block px-1 opacity-45" style={{ color: theme.secondaryColor }}>
            {t("personalFm.settings.modeLabel")}
          </span>
          <div
            aria-label={t("personalFm.settings.modeLabel")}
            className={`flex min-w-0 touch-pan-y [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain rounded-xl p-1 select-none [&::-webkit-scrollbar]:hidden ${
              horizontalScroll.isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            role="group"
            style={trackStyle}
            {...horizontalScroll.scrollHandlers}
          >
            {PERSONAL_FM_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={selection.mode === mode.id}
                disabled={isLoading}
                onClick={() => void selectMode(mode.id)}
                className="min-w-16 shrink-0 rounded-lg px-3 py-1.5 font-medium transition-[filter,box-shadow] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:cursor-wait disabled:opacity-45"
                style={getButtonStyle(selection.mode === mode.id)}
              >
                {t(mode.labelKey)}
              </button>
            ))}
          </div>
        </section>

        {SCENE_CATEGORIES.map((category) => (
          <section key={category} className="space-y-1.5">
            <span className="block px-1 opacity-45" style={{ color: theme.secondaryColor }}>
              {t(PERSONAL_FM_SCENE_CATEGORY_LABELS[category])}
            </span>
            <div
              aria-label={t(PERSONAL_FM_SCENE_CATEGORY_LABELS[category])}
              className={`min-w-0 touch-pan-y [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain rounded-xl p-1 select-none [&::-webkit-scrollbar]:hidden ${
                category === "genre" ? "grid auto-cols-max grid-flow-col grid-rows-2" : "flex"
              } ${horizontalScroll.isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              role="group"
              style={trackStyle}
              {...horizontalScroll.scrollHandlers}
            >
              {PERSONAL_FM_SCENES.filter((scene) => scene.category === category).map((scene) => {
                const active = selection.mode === "SCENE_RCMD" && selection.scene === scene.id;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    aria-pressed={active}
                    disabled={isLoading}
                    onClick={() =>
                      void usePersonalFmStore
                        .getState()
                        .setSelection({ mode: "SCENE_RCMD", scene: scene.id })
                    }
                    className="min-w-16 shrink-0 rounded-lg px-3 py-1.5 transition-[filter,box-shadow] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:cursor-wait disabled:opacity-45"
                    style={getButtonStyle(active)}
                  >
                    {t(scene.labelKey)}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
