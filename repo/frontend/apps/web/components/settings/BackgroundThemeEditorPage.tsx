"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import { HomeContent } from "@/components/home/HomeContent";
import { APPEARANCE_SETTINGS_PATH } from "@/constants/appearanceRoutes";
import { useBackgroundThemeEditor } from "@/hooks/settings/useBackgroundThemeEditor";
import { useI18n } from "@/store/module/i18n";
import type { BackgroundThemeEditorProps } from "@/types/appearance-theme-editor";
import { AppearancePreview } from "./AppearancePreview";
import { SettingSection } from "./SettingsUI";
import { ThemeEditorBoundary } from "./ThemeEditorBoundary";
import { ThemeEditorFrame } from "./ThemeEditorFrame";
import { ThemeEditorFields } from "./ThemeEditorFields";
import { ThemeNameField } from "./ThemeNameField";

export function BackgroundThemeEditorPage() {
  const params = useSearchParams();
  const themeId = params.get("id");
  return (
    <ThemeEditorBoundary>
      <BackgroundThemeEditor key={themeId ?? "new"} themeId={themeId} />
    </ThemeEditorBoundary>
  );
}

function BackgroundThemeEditor({ themeId }: BackgroundThemeEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const editor = useBackgroundThemeEditor(themeId);
  const finish = () => router.push(APPEARANCE_SETTINGS_PATH);
  return (
    <ThemeEditorFrame
      title={t("themeEditor.background")}
      dirty={editor.dirty}
      valid={editor.valid}
      onReset={editor.reset}
      onSave={() => {
        editor.save();
        finish();
      }}
      actions={
        !editor.isNew && (
          <Button
            variant="outline"
            disabled={!editor.draft.name.trim()}
            onClick={() => {
              editor.duplicate();
              finish();
            }}
          >
            {t("appearance.theme.saveAs")}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
        <SettingSection title={t("appearance.background")}>
          <ThemeNameField
            value={editor.draft.name}
            valid={editor.valid}
            onChange={(name) => editor.setDraft({ ...editor.draft, name })}
          />
          <ThemeEditorFields draft={editor.draft} onChange={editor.setDraft} />
        </SettingSection>
        <div className="min-w-0 lg:sticky lg:top-24">
          <SettingSection title={t("appearance.preview")}>
            <AppearancePreview background={editor.draft}>
              <HomeContent />
            </AppearancePreview>
          </SettingSection>
        </div>
      </div>
    </ThemeEditorFrame>
  );
}
