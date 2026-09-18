"use client";

import { useSubtitlePreview } from "@/hooks/settings/useSubtitlePreview";
import type { SubtitlePreviewWorkspaceProps } from "@/types/subtitle-preview";
import { useI18n } from "@/store/module/i18n";
import { LyricsStylePreview } from "./LyricsStylePreview";
import { SettingSection } from "./SettingsUI";
import { SubtitlePreviewControls } from "./SubtitlePreviewControls";
import { SubtitlePlaybackControls } from "./SubtitlePlaybackControls";

export function SubtitlePreviewWorkspace({
  settings,
  children,
  note,
}: SubtitlePreviewWorkspaceProps) {
  const { t } = useI18n();
  const preview = useSubtitlePreview(settings);
  return (
    <div
      id="subtitle-style"
      className="grid scroll-mt-24 grid-cols-1 items-start gap-x-16 gap-y-10 lg:col-span-2 lg:grid-cols-2"
    >
      <div className="min-w-0 space-y-8">{children}</div>
      <div className="min-w-0 lg:sticky lg:top-24">
        <SettingSection
          title={t("appearance.lyrics.preview")}
          actions={
            <SubtitlePlaybackControls
              playback={preview.playback}
              duration={preview.duration}
              onTogglePlayback={preview.togglePlayback}
              onReplay={preview.replay}
              visible={preview.visible}
              onVisibleChange={preview.setVisible}
              loop={preview.loop}
              onLoopChange={preview.setLoop}
            />
          }
        >
          <div className="space-y-6">
            <LyricsStylePreview
              settings={preview.previewSettings}
              note={note}
              payload={preview.payload}
              replayId={preview.replayId}
              visible={preview.visible}
              playback={preview.playback}
              loop={preview.loop}
            />
            <SubtitlePreviewControls
              activeScene={preview.activeScene}
              payload={preview.payload}
              onPayloadChange={preview.setPayload}
              onSceneChange={preview.selectScene}
            />
          </div>
        </SettingSection>
      </div>
    </div>
  );
}
