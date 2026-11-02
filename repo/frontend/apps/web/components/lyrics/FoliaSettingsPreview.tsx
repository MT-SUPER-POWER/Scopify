"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FoliaThemePreviewToolbar } from "@/components/lyrics/FoliaThemePreviewToolbar";

import VisPlaygroundPreviewHotspots from "@/components/lyrics/folia/src/components/visualizer/VisPlaygroundPreviewHotspots";
import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import { getVisualizerModeLabel } from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useFoliaSettingsPreview } from "@/hooks/lyrics/useFoliaSettingsPreview";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaSettingsPreviewProps } from "@/types/lyrics/components";
import { cn } from "@/lib/utils";

export function FoliaSettingsPreview({
  className,
  activeSection,
  assets,
  onSectionChange,
  theme,
  themeEditorContext,
}: FoliaSettingsPreviewProps) {
  const { t } = useTranslation();
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const [previewRestartToken, setPreviewRestartToken] = useState(0);
  const preview = useFoliaSettingsPreview(isPreviewPaused, previewRestartToken);
  const settings = useLyricStageStore();
  const isDaylight = theme.name === "snow";
  const modeLabel = getVisualizerModeLabel(settings.mode, t);

  return (
    <div
      className={cn(
        "relative h-full min-h-80 overflow-hidden rounded-xl border border-current/8",
        className,
      )}
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {themeEditorContext ? (
        <FoliaThemePreviewToolbar
          context={themeEditorContext}
          isPaused={isPreviewPaused}
          modeLabel={modeLabel}
          onPauseChange={setIsPreviewPaused}
          onRestart={() => setPreviewRestartToken((current) => current + 1)}
          theme={theme}
        />
      ) : (
        <button
          aria-label={t(isPreviewPaused ? "folia.ui.play" : "folia.ui.pause")}
          className="absolute top-3 right-3 z-40 grid size-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55"
          onClick={() => setIsPreviewPaused((paused) => !paused)}
          title={t(isPreviewPaused ? "folia.ui.play" : "folia.ui.pause")}
          type="button"
        >
          {isPreviewPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
        </button>
      )}

      <div className="absolute inset-0">
        <VisualizerRenderer
          mode={settings.mode}
          currentTime={preview.lyricCurrentTime}
          currentLineIndex={preview.currentLineIndex}
          lines={preview.lines}
          theme={theme}
          subtitleTheme={theme}
          isDaylight={isDaylight}
          audioPower={preview.audioPower}
          audioBands={preview.audioBands}
          showText
          songTitle={preview.title}
          songArtist={preview.artist}
          songAlbum={preview.album}
          coverUrl={preview.coverUrl}
          seed={preview.seed}
          staticMode={false}
          backgroundStaticMode={false}
          visualizerOpacity={settings.visualizerOpacity}
          background={{
            ...settings.background,
            customImage: assets.monetBackgroundImage,
            common: {
              ...settings.background.common,
              disableGeometricBackground: false,
            },
          }}
          lyricsFontScale={settings.fontScale}
          subtitleFontScale={settings.subtitleFontScale}
          subtitleOverlayOpacity={settings.subtitleOverlayOpacity}
          subtitleOverlayBackground={settings.subtitleOverlayBackground}
          isPlayerChromeHidden
          hideTranslationSubtitle={settings.hideTranslationSubtitle}
          showSubtitleTranslation={settings.showSubtitleTranslation}
          subtitleContentMode={settings.subtitleContentMode}
          harmonySubtitleBackground={settings.harmonySubtitleBackground}
          showHarmonySubtitle={settings.showHarmonySubtitle}
          paused={isPreviewPaused}
          cappellaCustomAvatarImages={assets.cappellaCustomAvatarImages}
          cappellaCustomEmojiImages={assets.cappellaCustomEmojiImages}
          monetPortraitImage={assets.monetPortraitImage}
          visualizerTunings={settings.tunings}
          onCladdaghTuningChange={(patch) => settings.patchTuning("claddagh", patch)}
          onMonetTuningChange={(patch) => settings.patchTuning("monet", patch)}
        />
      </div>

      <VisPlaygroundPreviewHotspots
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        theme={theme}
        labels={{
          background: String(t("folia.options.previewBackgroundHotspot")),
          subtitle: String(t("folia.options.previewSubtitleHotspot")),
          visualizer: String(t("folia.options.previewVisualizerHotspot")),
        }}
      />
    </div>
  );
}
