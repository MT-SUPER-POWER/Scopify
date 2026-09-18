"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { BACKGROUND_THEME_EDITOR_PATH } from "@/constants/appearanceRoutes";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
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
  const copyFrom = params.get("copy");
  return (
    <ThemeEditorBoundary>
      <BackgroundThemeEditor key={`${themeId}:${copyFrom}`} themeId={themeId} copyFrom={copyFrom} />
    </ThemeEditorBoundary>
  );
}

function BackgroundThemeEditor(props: BackgroundThemeEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const editor = useBackgroundThemeEditor(props);
  const finish = (id: string | null) => {
    if (id)
      router.replace(`${BACKGROUND_THEME_EDITOR_PATH}?id=${encodeURIComponent(id)}&saved=1`, {
        scroll: false,
      });
  };
  return (
    <ThemeEditorFrame
      title={editor.missing ? t("appearance.background") : editor.draft.name}
      readOnly={editor.readOnly}
      missing={editor.missing}
      saved={params.get("saved") === "1"}
      dirty={editor.dirty}
      valid={editor.valid}
      onReset={editor.reset}
      onSave={() => finish(editor.save())}
      actions={
        editor.readOnly ? (
          <button
            type="button"
            className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
            onClick={() =>
              router.push(
                `${BACKGROUND_THEME_EDITOR_PATH}?copy=${encodeURIComponent(props.themeId ?? "")}`,
              )
            }
          >
            {t("themeEditor.copy")}
          </button>
        ) : (
          !editor.isNew && (
            <button
              type="button"
              className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
              disabled={!editor.valid}
              onClick={() => finish(editor.duplicate())}
            >
              {t("appearance.theme.saveAs")}
            </button>
          )
        )
      }
    >
      {!editor.missing && (
        <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
          <SettingSection title={t("appearance.background")}>
            {!editor.readOnly && (
              <ThemeNameField
                value={editor.draft.name}
                valid={editor.valid}
                onChange={(name) => editor.setDraft({ ...editor.draft, name })}
              />
            )}
            <ThemeEditorFields
              draft={editor.draft}
              onChange={editor.setDraft}
              readOnly={editor.readOnly}
            />
          </SettingSection>
          <div className="min-w-0 lg:sticky lg:top-24">
            <SettingSection title={t("appearance.preview")}>
              <AppearancePreview background={editor.draft}>
                <HomeContent />
              </AppearancePreview>
            </SettingSection>
          </div>
        </div>
      )}
    </ThemeEditorFrame>
  );
}
