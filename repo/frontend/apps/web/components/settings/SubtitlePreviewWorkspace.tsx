"use client";

import { useSubtitlePreview } from "@/hooks/settings/useSubtitlePreview";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import { LyricsStylePreview } from "./LyricsStylePreview";
import { LyricsStyleSettingsSection } from "./LyricsStyleSettingsSection";
import { SettingSection } from "./SettingsUI";
import { SubtitlePreviewControls } from "./SubtitlePreviewControls";

export function SubtitlePreviewWorkspace() {
  const { t } = useI18n();
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const updateSettings = useAppearanceStore((state) => state.updateLyricsPreview);
  const preview = useSubtitlePreview(settings, updateSettings);
  return (
    <div
      id="subtitle-style"
      className="grid scroll-mt-24 grid-cols-1 items-start gap-x-16 gap-y-10 lg:col-span-2 lg:grid-cols-2"
    >
      <div className="min-w-0 space-y-8">
        <LyricsStyleSettingsSection />
        <SettingSection title={t("subtitlePreview.scene")}>
          <SubtitlePreviewControls
            activeScene={preview.activeScene}
            payload={preview.payload}
            onPayloadChange={preview.setPayload}
            onSceneChange={preview.selectScene}
            onReplay={preview.replay}
            visible={preview.visible}
            onVisibleChange={preview.setVisible}
            loop={preview.loop}
            onLoopChange={preview.setLoop}
            playback={preview.playback}
            duration={preview.duration}
            onTogglePlayback={preview.togglePlayback}
            onSeek={preview.seek}
          />
        </SettingSection>
      </div>
      <div className="min-w-0 lg:sticky lg:top-24">
        <SettingSection title={t("appearance.lyrics.preview")}>
          <LyricsStylePreview
            settings={settings}
            payload={preview.payload}
            replayId={preview.replayId}
            visible={preview.visible}
            playback={preview.playback}
            loop={preview.loop}
          />
        </SettingSection>
      </div>
    </div>
  );
}
