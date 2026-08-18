import React, { useEffect, useMemo, useState } from "react";
import { THEME_PRESETS } from "@scopify/ui/folia";
import {
  AlertTriangle,
  CaptionsOff,
  Monitor,
  PanelTop,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  type CappellaAvatarImage,
  type CappellaEmojiImage,
  type CappellaTuning,
  type ClassicTuning,
  type CladdaghTuning,
  type FumeTuning,
  type MonetPortraitImage,
  type MonetTuning,
  type PartitaTuning,
  type PendoloTuning,
  type SonnetTuning,
  type SubtitleContentMode,
  type Theme,
  type TiltTuning,
  type DioramaTuning,
  type VisualizerMode,
} from "../../types";
import { colorWithAlpha } from "./colorMix";
import {
  VISUALIZER_REGISTRY,
  getVisualizerModeLabel,
  type VisualizerRegistryEntry,
} from "./registry";
import { type VisPlaygroundEditSection } from "./VisPlaygroundPreviewHotspots";
import type {
  VisualizerBackgroundActions,
  VisualizerBackgroundConfig,
} from "./backgrounds/definition";
import {
  DEFAULT_VISUALIZER_BACKGROUND_MODE,
  getVisualizerBackgroundModeLabel,
  getVisualizerBackgroundRegistryEntry,
  VISUALIZER_BACKGROUND_REGISTRY,
} from "./backgrounds/registry";

// src/components/visualizer/VisPlaygroundSettingsPanel.tsx
// Right-side settings panel for the click-to-edit visualizer playground.
interface PresetOption<T> {
  label: string;
  value: T;
}

interface PresetGroupProps<T> {
  label: string;
  value: T;
  options: PresetOption<T>[];
  onChange: (next: T) => void;
  isDaylight: boolean;
  theme: Theme;
  isOptionActive?: (option: PresetOption<T>) => boolean;
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  theme: Theme;
  icon?: LucideIcon;
}

interface VisPlaygroundSettingsPanelProps {
  activeSection: VisPlaygroundEditSection;
  onSectionChange: (section: VisPlaygroundEditSection) => void;
  t: import("@/types/i18n.generated").TranslateFn;
  isDaylight: boolean;
  theme: Theme;
  visualizerMode: VisualizerMode;
  visualizerEntry: VisualizerRegistryEntry;
  onVisualizerModeChange?: (mode: VisualizerMode) => void;
  onResetVisualizerTuning?: () => void;
  controlCardBg: string;
  rangeInputClass: string;
  visualizerOpacity: number;
  onVisualizerOpacityChange?: (opacity: number) => void;
  backgroundConfig?: VisualizerBackgroundConfig;
  backgroundActions?: VisualizerBackgroundActions;
  fontStyleValue: Theme["fontStyle"] | "custom";
  builtinFontOptions: PresetOption<Theme["fontStyle"]>[];
  fontStyleOptions: PresetOption<Theme["fontStyle"] | "custom">[];
  subtitleFontStyleOptions: PresetOption<Theme["fontStyle"] | "custom">[];
  onFontStyleChange: (fontStyle: Theme["fontStyle"] | "custom") => void;
  fontScale: number;
  fontScaleOptions: PresetOption<number>[];
  onFontScaleChange: (fontScale: number) => void;
  subtitleFontScale: number;
  onSubtitleFontScaleChange: (fontScale: number) => void;
  onResetCommonSettings?: () => void;
  classicTuning: ClassicTuning;
  onClassicTuningChange?: (patch: Partial<ClassicTuning>) => void;
  partitaTuning: PartitaTuning;
  onPartitaTuningChange?: (patch: Partial<PartitaTuning>) => void;
  fumeTuning: FumeTuning;
  onFumeTuningChange?: (patch: Partial<FumeTuning>) => void;
  claddaghTuning: CladdaghTuning;
  onCladdaghTuningChange?: (patch: Partial<CladdaghTuning>) => void;
  pendoloTuning?: PendoloTuning;
  onPendoloTuningChange?: (patch: Partial<PendoloTuning>) => void;
  sonnetTuning?: SonnetTuning;
  onSonnetTuningChange?: (patch: Partial<SonnetTuning>) => void;
  cappellaTuning: CappellaTuning;
  cappellaCustomEmojiImages: CappellaEmojiImage[];
  onCappellaTuningChange?: (patch: Partial<CappellaTuning>) => void;
  isLoadingCappellaCustomEmojiPack: boolean;
  onImportCappellaCustomEmojiPack?: (files: File[]) => Promise<{ ok: boolean; error?: string }>;
  onClearCappellaCustomEmojiPack?: () => Promise<void> | void;
  cappellaCustomAvatarImages?: CappellaAvatarImage[];
  onImportCappellaCustomAvatar?: (files: File[]) => Promise<{ ok: boolean; error?: string }>;
  onClearCappellaCustomAvatar?: () => Promise<void> | void;
  isLoadingCappellaCustomAvatarPack?: boolean;
  tiltTuning: TiltTuning;
  onTiltTuningChange?: (patch: Partial<TiltTuning>) => void;
  dioramaTuning?: DioramaTuning;
  onDioramaTuningChange?: (patch: Partial<DioramaTuning>) => void;
  monetTuning: MonetTuning;
  onMonetTuningChange?: (patch: Partial<MonetTuning>) => void;
  onResetMonetTuning?: () => void;
  monetPortraitImage?: MonetPortraitImage | null;
  onUploadMonetPortraitImage?: (files: File[]) => Promise<{ ok: boolean; error?: string }>;
  onClearMonetPortraitImage?: () => Promise<void> | void;
  isLoadingMonetPortraitImage?: boolean;
  hideTranslationSubtitle: boolean;
  onToggleHideTranslationSubtitle?: (hidden: boolean) => void;
  onToggleShowSubtitleTranslation?: (shown: boolean) => void;
  subtitleContentMode: SubtitleContentMode;
  onSubtitleContentModeChange?: (mode: SubtitleContentMode) => void;
  subtitleOverlayOpacity: number;
  onSubtitleOverlayOpacityChange?: (opacity: number) => void;
  subtitleOverlayBackground: boolean;
  onToggleSubtitleOverlayBackground?: (enabled: boolean) => void;
  subtitleFontInheritsLyrics: boolean;
  onSubtitleFontInheritsLyricsChange?: (inheritsLyrics: boolean) => void;
  subtitleFontStyle: Theme["fontStyle"];
  onSubtitleFontStyleChange?: (fontStyle: Theme["fontStyle"]) => void;
  subtitleFontFamily?: string | null;
  onSubtitleFontFamilyChange?: (fontFamily: string | null) => void;
  subtitleFontFallbackFamilies: string[];
  onSubtitleFontFallbackFamiliesChange?: (families: string[]) => void;
  onOpenSubtitleFontPicker?: () => void;
  onResetSubtitleSettings?: () => void;
  onSliderPointerDown?: () => void;
  onSliderCommit?: () => void;
  themePresetId?: string;
  onThemePresetChange?: (id: string) => void;
  themeControl?: React.ReactNode;
}

const SECTION_OPTIONS: VisPlaygroundEditSection[] = [
  "common",
  "background",
  "visualizer",
  "subtitle",
];

const getSectionLabel = (
  section: VisPlaygroundEditSection,
  t: import("@/types/i18n.generated").TranslateFn,
) => {
  if (section === "common") return t("folia.options.previewCommonSettings");
  if (section === "background") return t("folia.options.previewBackgroundSettings");
  if (section === "subtitle") return t("folia.options.previewSubtitleSettings");
  return t("folia.options.previewVisualizerSettings");
};

const getAccentOptionStyle = (
  selected: boolean,
  theme: Theme,
  isDaylight: boolean,
): React.CSSProperties =>
  selected
    ? {
        borderColor: theme.accentColor,
        boxShadow: `inset 0 0 0 1px ${theme.accentColor}`,
        backgroundColor: colorWithAlpha(theme.accentColor, isDaylight ? 0.1 : 0.16),
      }
    : {
        borderColor: colorWithAlpha(theme.secondaryColor, isDaylight ? 0.18 : 0.16),
        backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.24 : 0.34),
      };

const PresetGroup = <T,>({
  label,
  value,
  options,
  onChange,
  isDaylight,
  theme,
  isOptionActive,
}: PresetGroupProps<T>) => (
  <div className="space-y-2.5">
    <div
      className="text-xs font-medium tracking-[0.24em] uppercase opacity-60"
      style={{ color: theme.secondaryColor }}
    >
      {label}
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = isOptionActive ? isOptionActive(option) : option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-full border px-3 py-2 text-sm transition-all"
            style={{
              ...getAccentOptionStyle(isActive, theme, isDaylight),
              color: theme.primaryColor,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  checked,
  onChange,
  theme,
  icon: Icon = Monitor,
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: theme.primaryColor }}
      >
        <Icon size={14} />
        {label}
      </div>
      {description && (
        <div className="max-w-80 text-xs opacity-70" style={{ color: theme.secondaryColor }}>
          {description}
        </div>
      )}
    </div>
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange?.(!checked)}
      className="h-6 w-12 shrink-0 rounded-full p-1 transition-colors disabled:opacity-45"
      disabled={!onChange}
      style={{
        backgroundColor: checked
          ? theme.secondaryColor
          : colorWithAlpha(theme.secondaryColor, 0.18),
      }}
    >
      <div
        className={`size-4 rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"}`}
        style={{ backgroundColor: theme.backgroundColor }}
      />
    </button>
  </div>
);

const ResetSectionButton: React.FC<{
  label: string;
  onClick?: () => void;
  theme: Theme;
}> = ({ label, onClick, theme }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-45"
    style={{
      color: theme.secondaryColor,
      borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
      backgroundColor: colorWithAlpha(theme.backgroundColor, 0.22),
    }}
  >
    <RotateCcw size={12} />
    {label}
  </button>
);

const SectionTabs: React.FC<
  Pick<
    VisPlaygroundSettingsPanelProps,
    "activeSection" | "onSectionChange" | "t" | "theme" | "isDaylight"
  >
> = ({ activeSection, onSectionChange, t, theme, isDaylight }) => (
  <div
    className="inline-flex w-fit items-center gap-1 rounded-full p-1"
    style={{ backgroundColor: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.34 : 0.52) }}
  >
    {SECTION_OPTIONS.map((section) => {
      const active = activeSection === section;
      return (
        <button
          key={section}
          type="button"
          onClick={() => onSectionChange(section)}
          className="rounded-full border px-3 py-1.5 text-sm transition-all"
          style={{
            ...getAccentOptionStyle(active, theme, isDaylight),
            color: active ? theme.primaryColor : theme.secondaryColor,
          }}
        >
          {getSectionLabel(section, t)}
        </button>
      );
    })}
  </div>
);

const VisPlaygroundSettingsPanel: React.FC<VisPlaygroundSettingsPanelProps> = (props) => {
  const {
    activeSection,
    onSectionChange,
    t,
    isDaylight,
    theme,
    visualizerMode,
    visualizerEntry,
    onVisualizerModeChange,
    onResetVisualizerTuning,
    controlCardBg,
    rangeInputClass,
    visualizerOpacity,
    onVisualizerOpacityChange,
    backgroundConfig,
    backgroundActions,
    fontStyleValue,
    builtinFontOptions,
    fontStyleOptions,
    subtitleFontStyleOptions,
    onFontStyleChange,
    fontScale,
    fontScaleOptions,
    onFontScaleChange,
    subtitleFontScale,
    onSubtitleFontScaleChange,
    onResetCommonSettings,
    classicTuning,
    onClassicTuningChange,
    partitaTuning,
    onPartitaTuningChange,
    fumeTuning,
    onFumeTuningChange,
    claddaghTuning,
    onCladdaghTuningChange,
    cappellaTuning,
    cappellaCustomEmojiImages,
    onCappellaTuningChange,
    isLoadingCappellaCustomEmojiPack,
    onImportCappellaCustomEmojiPack,
    onClearCappellaCustomEmojiPack,
    cappellaCustomAvatarImages = [],
    onImportCappellaCustomAvatar,
    onClearCappellaCustomAvatar,
    isLoadingCappellaCustomAvatarPack = false,
    tiltTuning,
    onTiltTuningChange,
    dioramaTuning,
    onDioramaTuningChange,
    monetTuning,
    onMonetTuningChange,
    pendoloTuning,
    onPendoloTuningChange,
    sonnetTuning,
    onSonnetTuningChange,
    monetPortraitImage,
    onUploadMonetPortraitImage,
    onClearMonetPortraitImage,
    isLoadingMonetPortraitImage,
    hideTranslationSubtitle,
    onToggleHideTranslationSubtitle,
    onToggleShowSubtitleTranslation,
    subtitleContentMode,
    onSubtitleContentModeChange,
    subtitleOverlayOpacity,
    onSubtitleOverlayOpacityChange,
    subtitleOverlayBackground,
    onToggleSubtitleOverlayBackground,
    subtitleFontInheritsLyrics,
    onSubtitleFontInheritsLyricsChange,
    subtitleFontStyle,
    onSubtitleFontStyleChange,
    subtitleFontFamily,
    onSubtitleFontFamilyChange,
    subtitleFontFallbackFamilies,
    onSubtitleFontFallbackFamiliesChange,
    onOpenSubtitleFontPicker,
    onResetSubtitleSettings,
    onSliderPointerDown,
    onSliderCommit,
    themePresetId,
    onThemePresetChange,
    themeControl,
  } = props;

  const modeOptions = useMemo(
    () =>
      VISUALIZER_REGISTRY.map((entry) => ({
        label: getVisualizerModeLabel(entry.mode, t),
        value: entry.mode,
      })),
    [t],
  );
  const [subtitleFontFamilyDraft, setSubtitleFontFamilyDraft] = useState(subtitleFontFamily ?? "");

  useEffect(() => {
    setSubtitleFontFamilyDraft(subtitleFontFamily ?? "");
  }, [subtitleFontFamily]);

  const enablePlayerPageNativeBlur = false;
  const resolvedBackgroundMode = backgroundConfig?.mode ?? DEFAULT_VISUALIZER_BACKGROUND_MODE;
  const backgroundEntry = getVisualizerBackgroundRegistryEntry(resolvedBackgroundMode);
  const backgroundModeOptions = useMemo(
    () =>
      VISUALIZER_BACKGROUND_REGISTRY.map((entry) => ({
        value: entry.mode,
        label: getVisualizerBackgroundModeLabel(entry.mode, t),
      })),
    [t],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <SectionTabs
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        t={t}
        theme={theme}
        isDaylight={isDaylight}
      />

      <div className="visualizer-overlay-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
        {activeSection === "common" && (
          <div
            className="space-y-4 rounded-[24px] border p-4"
            style={{
              backgroundColor: controlCardBg,
              borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                  {t("folia.options.previewCommonSettings")}
                </div>
                <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                  {t("folia.options.previewCommonSettingsDesc")}
                </div>
              </div>
              <ResetSectionButton
                label={t("folia.ui.default")}
                onClick={onResetCommonSettings}
                theme={theme}
              />
            </div>

            {themeControl && <div className="space-y-3.5">{themeControl}</div>}

            <div className="space-y-2.5">
              <div
                className="text-xs font-medium tracking-[0.24em] uppercase opacity-45"
                style={{ color: theme.secondaryColor }}
              >
                {t("folia.options.themePresets")}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isActive = themePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onThemePresetChange?.(preset.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all"
                      style={{
                        ...getAccentOptionStyle(isActive, theme, isDaylight),
                        color: theme.primaryColor,
                      }}
                    >
                      <div className="flex gap-0.5">
                        {[
                          preset.colors.backgroundColor,
                          preset.colors.primaryColor,
                          preset.colors.accentColor,
                          preset.colors.secondaryColor,
                        ].map((c, i) => (
                          <div
                            key={i}
                            className="size-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] leading-tight font-medium opacity-80">
                        {t(preset.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <PresetGroup
              label={t("folia.options.fontFamily")}
              value={fontStyleValue}
              options={fontStyleOptions}
              onChange={onFontStyleChange}
              isDaylight={isDaylight}
              theme={theme}
              isOptionActive={(option) => option.value === fontStyleValue}
            />

            <PresetGroup
              label={t("folia.options.fontSize")}
              value={fontScale}
              options={fontScaleOptions}
              onChange={onFontScaleChange}
              isDaylight={isDaylight}
              theme={theme}
            />

            <div className="space-y-2">
              <div
                className="flex items-center justify-between text-sm"
                style={{ color: theme.primaryColor }}
              >
                <span>{t("folia.options.fontSize")}</span>
                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                  {Math.round(fontScale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.4"
                step="0.05"
                value={fontScale}
                onChange={(event) => onFontScaleChange(parseFloat(event.target.value))}
                onInput={(event) => onFontScaleChange(parseFloat((event.target as HTMLInputElement).value))}
                onPointerDown={onSliderPointerDown}
                onPointerUp={onSliderCommit}
                className={rangeInputClass}
              />
            </div>

            <div className="space-y-2">
              <div
                className="flex items-center justify-between text-sm"
                style={{ color: theme.primaryColor }}
              >
                <span>{t("folia.options.visualizerOpacity")}</span>
                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                  {Math.round(visualizerOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={visualizerOpacity}
                onChange={(event) => onVisualizerOpacityChange?.(parseFloat(event.target.value))}
                onInput={(event) =>
                  onVisualizerOpacityChange?.(parseFloat((event.target as HTMLInputElement).value))
                }
                onPointerDown={onSliderPointerDown}
                onPointerUp={onSliderCommit}
                className={rangeInputClass}
              />
            </div>
          </div>
        )}

        {activeSection === "background" && (
          <>
            {enablePlayerPageNativeBlur && (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                <span>{t("folia.options.nativeBlurBackgroundNotice")}</span>
              </div>
            )}
            <div
              className="space-y-4 rounded-[24px] border p-4"
              style={{
                backgroundColor: controlCardBg,
                borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                    {t("folia.options.previewBackgroundSettings")}
                  </div>
                  <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                    {t("folia.options.previewBackgroundSettingsDesc")}
                  </div>
                </div>
                <ResetSectionButton
                  label={t("folia.ui.default")}
                  onClick={
                    backgroundEntry.resetSettings
                      ? () => backgroundEntry.resetSettings?.(backgroundActions)
                      : undefined
                  }
                  theme={theme}
                />
              </div>

              <PresetGroup
                label={t("folia.options.visualizerBackgroundMode")}
                value={resolvedBackgroundMode}
                options={backgroundModeOptions}
                onChange={(mode) => backgroundActions?.onModeChange?.(mode)}
                isDaylight={isDaylight}
                theme={theme}
              />
            </div>

            {backgroundEntry.renderSettingsPanel?.({
              config: backgroundConfig,
              actions: backgroundActions,
              t,
              isDaylight,
              theme,
              controlCardBg,
              rangeInputClass,
              onSliderPointerDown,
              onSliderCommit,
            })}
          </>
        )}

        {activeSection === "visualizer" && (
          <>
            <div
              className="space-y-4 rounded-[24px] border p-4"
              style={{
                backgroundColor: controlCardBg,
                borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                    {t("folia.options.lyricsRenderer")}
                  </div>
                  <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                    {t("folia.options.lyricsRendererDesc")}
                  </div>
                </div>
                <ResetSectionButton
                  label={t("folia.ui.default")}
                  onClick={visualizerEntry.resetSettings ? onResetVisualizerTuning : undefined}
                  theme={theme}
                />
              </div>

              <PresetGroup
                label={t("folia.options.visualizerMode")}
                value={visualizerMode}
                options={modeOptions}
                onChange={(mode) => onVisualizerModeChange?.(mode)}
                isDaylight={isDaylight}
                theme={theme}
              />
            </div>

            {visualizerEntry.renderSettingsPanel?.({
              t,
              isDaylight,
              theme,
              controlCardBg,
              rangeInputClass,
              classicTuning,
              onClassicTuningChange,
              partitaTuning,
              onPartitaTuningChange,
              fumeTuning,
              onFumeTuningChange,
              claddaghTuning,
              onCladdaghTuningChange,
              cappellaTuning,
              cappellaCustomEmojiImages,
              onCappellaTuningChange,
              cappellaCustomEmojiCount: cappellaCustomEmojiImages.length,
              hasCappellaCustomEmojiPack: cappellaCustomEmojiImages.length > 0,
              isCappellaCustomEmojiPackLoading: isLoadingCappellaCustomEmojiPack,
              onImportCappellaCustomEmojiPack,
              onClearCappellaCustomEmojiPack,
              cappellaCustomAvatarImages,
              onImportCappellaCustomAvatar,
              onClearCappellaCustomAvatar,
              hasCappellaCustomAvatar: cappellaCustomAvatarImages.length > 0,
              isCappellaCustomAvatarLoading: isLoadingCappellaCustomAvatarPack,
              tiltTuning,
              onTiltTuningChange,
              dioramaTuning,
              onDioramaTuningChange,
              monetTuning,
              onMonetTuningChange,
              pendoloTuning,
              onPendoloTuningChange,
              sonnetTuning,
              onSonnetTuningChange,
              monetPortraitImage,
              onUploadMonetPortraitImage,
              onClearMonetPortraitImage,
              isLoadingMonetPortraitImage,
              onSliderPointerDown,
              onSliderCommit,
            })}
          </>
        )}

        {activeSection === "subtitle" && (
          <div
            className="space-y-4 rounded-[24px] border p-4"
            style={{
              backgroundColor: controlCardBg,
              borderColor: colorWithAlpha(theme.secondaryColor, 0.16),
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium" style={{ color: theme.primaryColor }}>
                  {t("folia.options.previewSubtitleSettings")}
                </div>
                <div className="text-xs opacity-70" style={{ color: theme.secondaryColor }}>
                  {t("folia.options.previewSubtitleSettingsDesc")}
                </div>
              </div>
              <ResetSectionButton
                label={t("folia.ui.default")}
                onClick={onResetSubtitleSettings}
                theme={theme}
              />
            </div>

            <ToggleRow
              label={t("folia.options.hidePlayerTranslationSubtitle")}
              description={t("folia.options.hidePlayerTranslationSubtitleDesc")}
              checked={hideTranslationSubtitle}
              onChange={onToggleHideTranslationSubtitle}
              theme={theme}
              icon={CaptionsOff}
            />

            <PresetGroup<SubtitleContentMode>
              label={t("folia.options.subtitleContentMode")}
              value={subtitleContentMode}
              options={[
                {
                  label: t("folia.options.subtitleContentTranslation"),
                  value: "translation",
                },
                {
                  label: t("folia.options.subtitleContentRomanization"),
                  value: "romanization",
                },
                { label: t("folia.options.subtitleContentNone"), value: "none" },
              ]}
              onChange={
                onSubtitleContentModeChange ??
                ((mode) => onToggleShowSubtitleTranslation?.(mode !== "none"))
              }
              isDaylight={isDaylight}
              theme={theme}
            />

            <ToggleRow
              label={t("folia.options.subtitleOverlayBackground")}
              description={t("folia.options.subtitleOverlayBackgroundDesc")}
              checked={subtitleOverlayBackground}
              onChange={onToggleSubtitleOverlayBackground}
              theme={theme}
              icon={PanelTop}
            />

            <ToggleRow
              label={t("folia.options.subtitleFontInheritsLyrics")}
              description={t("folia.options.subtitleFontInheritsLyricsDesc")}
              checked={subtitleFontInheritsLyrics}
              onChange={onSubtitleFontInheritsLyricsChange}
              theme={theme}
              icon={Monitor}
            />

            <div className="space-y-2">
              <div
                className="flex items-center justify-between text-sm"
                style={{ color: theme.primaryColor }}
              >
                <span>{t("folia.options.subtitleFontScale")}</span>
                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                  {Math.round(subtitleFontScale * 100)}%
                </span>
              </div>
              <input
                aria-label={t("folia.options.subtitleFontScale")}
                type="range"
                min="0.85"
                max="1.4"
                step="0.05"
                value={subtitleFontScale}
                onChange={(event) => onSubtitleFontScaleChange(parseFloat(event.target.value))}
                onInput={(event) =>
                  onSubtitleFontScaleChange(parseFloat((event.target as HTMLInputElement).value))
                }
                onPointerDown={onSliderPointerDown}
                onPointerUp={onSliderCommit}
                className={rangeInputClass}
              />
            </div>

            {!subtitleFontInheritsLyrics && (
              <div className="space-y-4">
                <PresetGroup
                  label={t("folia.options.subtitleFontFamily")}
                  value={subtitleFontFamily ? "custom" : subtitleFontStyle}
                  options={subtitleFontStyleOptions}
                  onChange={(next) => {
                    if (next === "custom") {
                      onOpenSubtitleFontPicker?.();
                    } else {
                      onSubtitleFontFamilyChange?.(null);
                      onSubtitleFontStyleChange?.(next as Theme["fontStyle"]);
                    }
                  }}
                  isDaylight={isDaylight}
                  theme={theme}
                />
              </div>
            )}

            <div className="space-y-2">
              <div
                className="flex items-center justify-between text-sm"
                style={{ color: theme.primaryColor }}
              >
                <span>{t("folia.options.subtitleOverlayOpacity")}</span>
                <span className="font-mono opacity-70" style={{ color: theme.secondaryColor }}>
                  {Math.round(subtitleOverlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={subtitleOverlayOpacity}
                onChange={(event) =>
                  onSubtitleOverlayOpacityChange?.(parseFloat(event.target.value))
                }
                onInput={(event) =>
                  onSubtitleOverlayOpacityChange?.(
                    parseFloat((event.target as HTMLInputElement).value),
                  )
                }
                onPointerDown={onSliderPointerDown}
                onPointerUp={onSliderCommit}
                className={rangeInputClass}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisPlaygroundSettingsPanel;
