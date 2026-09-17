"use client";

import { HomeContent } from "@/components/home/HomeContent";
import { useI18n } from "@/store/module/i18n";
import { AppearancePreview } from "./AppearancePreview";
import { AppearancePreviewStatus } from "./AppearancePreviewStatus";
import { BackgroundSettingsSection } from "./BackgroundSettingsSection";
import { LyricsStylePreview } from "./LyricsStylePreview";
import { LyricsStyleSettingsSection } from "./LyricsStyleSettingsSection";
import { SettingSection } from "./SettingsUI";

export function AppearanceSettingsTab() {
  const { t } = useI18n();
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
      <div className="min-w-0">
        <LyricsStyleSettingsSection />
      </div>
      <div className="min-w-0">
        <SettingSection title={t("appearance.lyrics.preview")}>
          <LyricsStylePreview />
        </SettingSection>
      </div>
    </div>
  );
}
