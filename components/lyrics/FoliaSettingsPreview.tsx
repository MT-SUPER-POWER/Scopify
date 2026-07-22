"use client";

import VisualizerRenderer from "@/components/lyrics/folia/src/components/visualizer/VisualizerRenderer";
import { useLyricStageStore } from "@/store/module/lyrics";
import { usePlayerStore } from "@/store/module/player";
import type { FoliaSettingsPreviewProps } from "@/types/components/lyrics";

export function FoliaSettingsPreview({ assets, bridge, theme }: FoliaSettingsPreviewProps) {
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const settings = useLyricStageStore();
  const songArtist = currentSong?.ar.map((artist) => artist.name).join(", ") ?? null;

  return (
    <div className="relative h-full min-h-64 overflow-hidden bg-[#09090b]">
      <VisualizerRenderer
        mode={settings.mode}
        currentTime={bridge.lyricCurrentTime}
        currentLineIndex={bridge.currentLineIndex}
        lines={bridge.lines}
        theme={theme}
        subtitleTheme={theme}
        isDaylight={false}
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
  );
}
