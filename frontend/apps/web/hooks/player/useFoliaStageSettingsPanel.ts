"use client";

import { useMemo } from "react";

import {
  DEFAULT_CAPPELLA_TUNING,
  DEFAULT_CLASSIC_TUNING,
  DEFAULT_CLADDAGH_TUNING,
  DEFAULT_DIORAMA_TUNING,
  DEFAULT_FUME_TUNING,
  DEFAULT_MONET_TUNING,
  DEFAULT_PENDOLO_TUNING,
  DEFAULT_PARTITA_TUNING,
  DEFAULT_SONNET_TUNING,
  DEFAULT_TILT_TUNING,
  type Theme,
} from "@/components/lyrics/folia/src/types";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import {
  getVisualizerRegistryEntry,
  hasVisualizerMode,
} from "@/components/lyrics/folia/src/components/visualizer/registry";
import { hasVisualizerTuningMode } from "@/components/lyrics/folia/src/components/visualizer/tuningRegistry";
import type { VisualizerBackgroundActions } from "@/components/lyrics/folia/src/components/visualizer/backgrounds/definition";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaStageAssets } from "@/types/foliaAssets";
import type { FoliaStageEditSection } from "@/types/foliaStage";

const FONT_SCALE_OPTIONS = [
  { label: "90%", value: 0.9 },
  { label: "100%", value: 1 },
  { label: "110%", value: 1.1 },
  { label: "125%", value: 1.25 },
];

export function useFoliaStageSettingsPanel(
  activeSection: FoliaStageEditSection,
  onSectionChange: (section: FoliaStageEditSection) => void,
  theme: Theme,
  assets: FoliaStageAssets,
  onOpenFontPicker: (target: "lyrics" | "subtitle") => void,
) {
  const { t } = useI18n();
  const settings = useLyricStageStore();
  const isDaylight = theme.name === "snow";
  const builtinFontOptions = useMemo(
    () => [
      { label: t("folia.options.fontSans"), value: "sans" as const },
      { label: t("folia.options.fontSerif"), value: "serif" as const },
      { label: t("folia.options.fontMono"), value: "mono" as const },
    ],
    [t],
  );
  const fontStyleOptions = useMemo(
    () => [
      ...builtinFontOptions,
      {
        label: assets.lyricsCustomFont?.label ?? t("folia.options.customFont"),
        value: "custom" as const,
      },
    ],
    [assets.lyricsCustomFont?.label, builtinFontOptions, t],
  );
  const visualizerEntry = getVisualizerRegistryEntry(settings.mode);
  const backgroundActions = useMemo<VisualizerBackgroundActions>(
    () => ({
      common: {
        onCoverColorChange: (useCoverColorBg) =>
          settings.patchBackgroundCommon({ useCoverColorBg }),
        onDisableGeometricChange: (disableGeometricBackground) =>
          settings.patchBackgroundCommon({ disableGeometricBackground }),
        onDisableVignetteChange: (disableVignette) =>
          settings.patchBackgroundCommon({ disableVignette }),
        onOpacityChange: (opacity) => settings.patchBackgroundCommon({ opacity }),
      },
      customImage: {
        isLoading: assets.isLoadingMonetBackgroundImage,
        onClear: assets.clearMonetBackgroundImage,
        onUpload: assets.uploadMonetBackgroundImage,
      },
      latent: {
        onResetTuning: () => settings.resetBackgroundTuning("latent"),
        onTuningChange: settings.patchLatentBackground,
      },
      monet: {
        onResetTuning: () => settings.resetBackgroundTuning("monet"),
        onTuningChange: settings.patchMonetBackground,
      },
      nomand: {
        onResetTuning: () => settings.resetBackgroundTuning("nomand"),
        onTuningChange: settings.patchNomandBackground,
      },
      onModeChange: settings.setBackgroundMode,
      url: {
        onAdd: settings.addUrlBackground,
        onDelete: settings.deleteUrlBackground,
        onSelect: settings.selectUrlBackground,
        onUpdate: settings.updateUrlBackground,
      },
    }),
    [assets, settings],
  );
  const rangeInputClass = [
    "h-1.5 w-full cursor-pointer appearance-none rounded-full",
    "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125",
    "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0",
    isDaylight
      ? "bg-black/15 [&::-webkit-slider-thumb]:bg-zinc-700 [&::-moz-range-thumb]:bg-zinc-700"
      : "bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white",
  ].join(" ");
  const resetCurrentTuning = () => {
    const mode = settings.mode;
    if (hasVisualizerTuningMode(mode)) {
      settings.resetTuning(mode);
    }
  };

  return {
    activeSection,
    backgroundActions,
    backgroundConfig: { ...settings.background, customImage: assets.monetBackgroundImage },
    builtinFontOptions,
    cappellaCustomAvatarImages: assets.cappellaCustomAvatarImages,
    cappellaCustomEmojiImages: assets.cappellaCustomEmojiImages,
    cappellaTuning: settings.tunings.cappella ?? DEFAULT_CAPPELLA_TUNING,
    classicTuning: settings.tunings.classic ?? DEFAULT_CLASSIC_TUNING,
    claddaghTuning: settings.tunings.claddagh ?? DEFAULT_CLADDAGH_TUNING,
    controlCardBg: colorWithAlpha(theme.backgroundColor, isDaylight ? 0.42 : 0.52),
    dioramaTuning: settings.tunings.diorama ?? DEFAULT_DIORAMA_TUNING,
    fontScale: settings.fontScale,
    fontScaleOptions: FONT_SCALE_OPTIONS,
    fontStyleOptions,
    fontStyleValue: settings.fontFamily ? ("custom" as const) : settings.fontStyle,
    fumeTuning: settings.tunings.fume ?? DEFAULT_FUME_TUNING,
    hideTranslationSubtitle: settings.hideTranslationSubtitle,
    isDaylight,
    isLoadingCappellaCustomAvatarPack: assets.isLoadingCappellaCustomAvatarPack,
    isLoadingCappellaCustomEmojiPack: assets.isLoadingCappellaCustomEmojiPack,
    isLoadingMonetPortraitImage: assets.isLoadingMonetPortraitImage,
    monetPortraitImage: assets.monetPortraitImage,
    monetTuning: settings.tunings.monet ?? DEFAULT_MONET_TUNING,
    pendoloTuning: settings.tunings.pendolo ?? DEFAULT_PENDOLO_TUNING,
    sonnetTuning: settings.tunings.sonnet ?? DEFAULT_SONNET_TUNING,
    onCappellaTuningChange: (patch: Partial<typeof DEFAULT_CAPPELLA_TUNING>) =>
      settings.patchTuning("cappella", patch),
    onClearCappellaCustomAvatar: assets.clearCappellaCustomAvatar,
    onClearCappellaCustomEmojiPack: assets.clearCappellaCustomEmojiPack,
    onClearMonetPortraitImage: assets.clearMonetPortraitImage,
    onClassicTuningChange: (patch: Partial<typeof DEFAULT_CLASSIC_TUNING>) =>
      settings.patchTuning("classic", patch),
    onCladdaghTuningChange: (patch: Partial<typeof DEFAULT_CLADDAGH_TUNING>) =>
      settings.patchTuning("claddagh", patch),
    onDioramaTuningChange: (patch: Partial<typeof DEFAULT_DIORAMA_TUNING>) =>
      settings.patchTuning("diorama", patch),
    onFontScaleChange: (fontScale: number) =>
      settings.patchSettings({ fontScale: Math.min(1.4, Math.max(0.85, fontScale)) }),
    onFontStyleChange: (fontStyle: Theme["fontStyle"] | "custom") => {
      if (fontStyle === "custom") {
        onOpenFontPicker("lyrics");
      } else {
        settings.patchSettings({ fontFamily: null, fontStyle });
      }
    },
    onFumeTuningChange: (patch: Partial<typeof DEFAULT_FUME_TUNING>) =>
      settings.patchTuning("fume", patch),
    onImportCappellaCustomAvatar: assets.importCappellaCustomAvatar,
    onImportCappellaCustomEmojiPack: assets.importCappellaCustomEmojiPack,
    onMonetTuningChange: (patch: Partial<typeof DEFAULT_MONET_TUNING>) =>
      settings.patchTuning("monet", patch),
    onPartitaTuningChange: (patch: Partial<typeof DEFAULT_PARTITA_TUNING>) =>
      settings.patchTuning("partita", patch),
    onPendoloTuningChange: (patch: Partial<typeof DEFAULT_PENDOLO_TUNING>) =>
      settings.patchTuning("pendolo", patch),
    onSonnetTuningChange: (patch: Partial<typeof DEFAULT_SONNET_TUNING>) =>
      settings.patchTuning("sonnet", patch),
    onResetCommonSettings: () =>
      settings.patchSettings({ fontScale: 1, fontStyle: "sans", visualizerOpacity: 1 }),
    onResetMonetTuning: () => settings.resetTuning("monet"),
    onResetSubtitleSettings: () =>
      settings.patchSettings({
        hideTranslationSubtitle: false,
        showSubtitleTranslation: true,
        subtitleContentMode: "translation",
        subtitleFontFallbackFamilies: [],
        subtitleFontFamily: null,
        subtitleFontInheritsLyrics: true,
        subtitleFontScale: 1,
        subtitleFontStyle: "sans",
        subtitleOverlayBackground: true,
        subtitleOverlayOpacity: 0.6,
      }),
    onResetVisualizerTuning: resetCurrentTuning,
    onSectionChange,
    onSubtitleFontFallbackFamiliesChange: (subtitleFontFallbackFamilies: string[]) =>
      settings.patchSettings({ subtitleFontFallbackFamilies }),
    onSubtitleFontFamilyChange: (subtitleFontFamily: string | null) =>
      settings.patchSettings({ subtitleFontFamily }),
    onSubtitleFontInheritsLyricsChange: (subtitleFontInheritsLyrics: boolean) =>
      settings.patchSettings({ subtitleFontInheritsLyrics }),
    onSubtitleFontScaleChange: (subtitleFontScale: number) =>
      settings.patchSettings({
        subtitleFontScale: Math.min(1.4, Math.max(0.85, subtitleFontScale)),
      }),
    onOpenSubtitleFontPicker: () => onOpenFontPicker("subtitle"),
    onSubtitleFontStyleChange: (subtitleFontStyle: Theme["fontStyle"]) =>
      settings.patchSettings({ subtitleFontStyle }),
    onSubtitleOverlayOpacityChange: (subtitleOverlayOpacity: number) =>
      settings.patchSettings({ subtitleOverlayOpacity }),
    onTiltTuningChange: (patch: Partial<typeof DEFAULT_TILT_TUNING>) =>
      settings.patchTuning("tilt", patch),
    onToggleHideTranslationSubtitle: (hideTranslationSubtitle: boolean) =>
      settings.patchSettings({ hideTranslationSubtitle }),
    onToggleShowSubtitleTranslation: (showSubtitleTranslation: boolean) =>
      settings.patchSettings({
        showSubtitleTranslation,
        subtitleContentMode: showSubtitleTranslation ? "translation" : "none",
      }),
    onSubtitleContentModeChange: (subtitleContentMode: typeof settings.subtitleContentMode) =>
      settings.patchSettings({
        showSubtitleTranslation: subtitleContentMode !== "none",
        subtitleContentMode,
      }),
    onToggleSubtitleOverlayBackground: (subtitleOverlayBackground: boolean) =>
      settings.patchSettings({ subtitleOverlayBackground }),
    onUploadMonetPortraitImage: assets.uploadMonetPortraitImage,
    onVisualizerModeChange: (mode: string) => {
      if (hasVisualizerMode(mode)) {
        settings.requestVisualizerMode(mode as typeof settings.mode);
      }
    },
    onVisualizerOpacityChange: (visualizerOpacity: number) =>
      settings.patchSettings({ visualizerOpacity: Math.min(1, Math.max(0.1, visualizerOpacity)) }),
    partitaTuning: settings.tunings.partita ?? DEFAULT_PARTITA_TUNING,
    rangeInputClass,
    showSubtitleTranslation: settings.showSubtitleTranslation,
    subtitleContentMode: settings.subtitleContentMode,
    subtitleFontFallbackFamilies: settings.subtitleFontFallbackFamilies,
    subtitleFontFamily: settings.subtitleFontFamily,
    subtitleFontInheritsLyrics: settings.subtitleFontInheritsLyrics,
    subtitleFontScale: settings.subtitleFontScale,
    subtitleFontStyle: settings.subtitleFontStyle,
    subtitleFontStyleOptions: fontStyleOptions,
    subtitleOverlayBackground: settings.subtitleOverlayBackground,
    subtitleOverlayOpacity: settings.subtitleOverlayOpacity,
    t,
    theme,
    tiltTuning: settings.tunings.tilt ?? DEFAULT_TILT_TUNING,
    visualizerEntry,
    visualizerMode: settings.mode,
    visualizerOpacity: settings.visualizerOpacity,
  };
}
