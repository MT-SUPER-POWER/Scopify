"use client";

import { useAppearanceStore } from "@/store/module/appearance";
import { LyricsStyleSettingsSection } from "./LyricsStyleSettingsSection";
import { HomeContent } from "@/components/home/HomeContent";
import { useI18n } from "@/store/module/i18n";
import { AppearancePreview } from "./AppearancePreview";
import { AppearancePreviewStatus } from "./AppearancePreviewStatus";
import { BackgroundSettingsSection } from "./BackgroundSettingsSection";
import { SubtitlePreviewWorkspace } from "./SubtitlePreviewWorkspace";
import { SettingSection } from "./SettingsUI";

export function AppearanceSettingsTab() {
  const { t } = useI18n();
  const subtitleSettings = useAppearanceStore((state) => state.lyricsPreview);
  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <div className="min-w-0">
        <BackgroundSettingsSection />
      </div>
      <div className="min-w-0">
        <SettingSection title={t("appearance.preview")}>
          <AppearancePreview>
            <HomeContent />
          </AppearancePreview>
          <AppearancePreviewStatus />
        </SettingSection>
      </div>
      <SubtitlePreviewWorkspace settings={subtitleSettings}>
        <LyricsStyleSettingsSection />
      </SubtitlePreviewWorkspace>
    </div>
  );
}
