"use client";

import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import VisPlaygroundPreviewHotspots from "@/components/lyrics/folia/src/components/visualizer/VisPlaygroundPreviewHotspots";
import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import { getVisualizerModeLabel } from "@/components/lyrics/folia/src/components/visualizer/registry";
import { useLyricStageStore } from "@/store/module/lyrics";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaSettingsPreviewProps } from "@/types/components/lyrics";

export function FoliaSettingsPreview({
  activeSection,
  assets,
  bridge,
  onSectionChange,
  theme,
}: FoliaSettingsPreviewProps) {
  const { t } = useTranslation();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const settings = useLyricStageStore();
  const songArtist = currentSong?.ar.map((artist) => artist.name).join(", ") ?? null;
  const isDaylight = theme.name === "snow";
  const modeLabel = getVisualizerModeLabel(settings.mode, (key) => String(t(key)));

  return (
    <div
      className="relative min-h-80 overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div
        className="absolute top-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs tracking-[0.22em] uppercase backdrop-blur-md"
        style={{ color: "rgba(255,255,255,0.78)" }}
      >
        <Sparkles size={13} />
        <span>{t("ui.livePreview")}</span>
      </div>
      <div
        className="absolute top-4 right-4 z-40 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs backdrop-blur-md"
        style={{ color: "rgba(255,255,255,0.78)" }}
      >
        {modeLabel}
      </div>

      <div className="absolute inset-0">
        <VisualizerRenderer
          mode={settings.mode}
          currentTime={bridge.lyricCurrentTime}
          currentLineIndex={bridge.currentLineIndex}
          lines={bridge.lines}
          theme={theme}
          subtitleTheme={theme}
          isDaylight={isDaylight}
          audioPower={bridge.audioPower}
          audioBands={bridge.audioBands}
          showText
          songTitle={currentSong?.name ?? null}
          songArtist={songArtist}
          songAlbum={currentSong?.al.name ?? null}
          coverUrl={currentSong?.al.picUrl ?? null}
          seed={currentSong?.id ?? `settings-preview-${settings.mode}`}
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
          subtitleOverlayOpacity={settings.subtitleOverlayOpacity}
          subtitleOverlayBackground={settings.subtitleOverlayBackground}
          isPlayerChromeHidden
          hideTranslationSubtitle={settings.hideTranslationSubtitle}
          showSubtitleTranslation={settings.showSubtitleTranslation}
          paused={!bridge.isPlaying}
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
          background: String(t("options.previewBackgroundHotspot")),
          subtitle: String(t("options.previewSubtitleHotspot")),
          visualizer: String(t("options.previewVisualizerHotspot")),
        }}
      />
    </div>
  );
}
