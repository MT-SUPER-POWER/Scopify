"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import { subtitleThemeEditorHref } from "@/lib/settings/subtitleTheme";
import { useSubtitleThemeEditor } from "@/hooks/settings/useSubtitleThemeEditor";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleThemeEditorProps } from "@/types/subtitle-preview";
import { ThemeEditorBoundary } from "./ThemeEditorBoundary";
import { ThemeEditorFrame } from "./ThemeEditorFrame";
import { ThemeNameField } from "./ThemeNameField";
import { SubtitlePreviewWorkspace } from "./SubtitlePreviewWorkspace";
import { SubtitlePaletteFields } from "./SubtitlePaletteFields";
import { SettingSection } from "./SettingsUI";

export function SubtitleThemeEditorPage() {
  const params = useSearchParams();
  const themeId = params.get("id");
  const copyFrom = params.get("copy");
  const useCurrent = params.get("source") === "current";
  return (
    <ThemeEditorBoundary>
      <SubtitleThemeEditor
        key={`${themeId}:${copyFrom}:${useCurrent}`}
        themeId={themeId}
        copyFrom={copyFrom}
        useCurrent={useCurrent}
      />
    </ThemeEditorBoundary>
  );
}

function SubtitleThemeEditor(props: SubtitleThemeEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const editor = useSubtitleThemeEditor(props);
  const finish = (id: string | null) => {
    if (id) router.replace(`${subtitleThemeEditorHref(id)}&saved=1`, { scroll: false });
  };
  return (
    <ThemeEditorFrame
      title={editor.missing ? t("themeEditor.paletteLabel") : editor.draft.name}
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
              router.push(subtitleThemeEditorHref(undefined, false, props.themeId ?? undefined))
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
        <SubtitlePreviewWorkspace
          settings={editor.previewSettings}
          note={t("subtitlePalette.previewHint")}
          palettePreview
        >
          <SettingSection title={t("themeEditor.paletteLabel")}>
            {!editor.readOnly && (
              <ThemeNameField
                value={editor.draft.name}
                valid={editor.valid}
                onChange={editor.setName}
              />
            )}
            <SubtitlePaletteFields
              settings={editor.draft.settings}
              onChange={editor.update}
              readOnly={editor.readOnly}
            />
          </SettingSection>
        </SubtitlePreviewWorkspace>
      )}
    </ThemeEditorFrame>
  );
}
