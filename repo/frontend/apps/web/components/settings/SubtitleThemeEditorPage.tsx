"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import { APPEARANCE_SETTINGS_PATH } from "@/constants/appearanceRoutes";
import { useSubtitleThemeEditor } from "@/hooks/settings/useSubtitleThemeEditor";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleThemeEditorProps } from "@/types/subtitle-preview";
import { ThemeEditorBoundary } from "./ThemeEditorBoundary";
import { ThemeEditorFrame } from "./ThemeEditorFrame";
import { ThemeNameField } from "./ThemeNameField";
import { SubtitlePreviewWorkspace } from "./SubtitlePreviewWorkspace";
import { SubtitleStyleEditor } from "./SubtitleStyleEditor";
import { SubtitlePaletteFields } from "./SubtitlePaletteFields";
import { SubtitleColorPresets } from "./SubtitleColorPresets";

export function SubtitleThemeEditorPage() {
  const params = useSearchParams();
  const kind = params.get("kind") === "palette" ? "palette" : "style";
  const themeId = params.get("id");
  const useCurrent = params.get("source") === "current";
  return (
    <ThemeEditorBoundary>
      <SubtitleThemeEditor
        key={`${kind}:${themeId}:${useCurrent}`}
        kind={kind}
        themeId={themeId}
        useCurrent={useCurrent}
      />
    </ThemeEditorBoundary>
  );
}

function SubtitleThemeEditor(props: SubtitleThemeEditorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const editor = useSubtitleThemeEditor(props);
  const returnHref = `${APPEARANCE_SETTINGS_PATH}#subtitle-style`;
  return (
    <ThemeEditorFrame
      title={t(props.kind === "palette" ? "themeEditor.palette" : "themeEditor.subtitle")}
      dirty={editor.dirty}
      valid={editor.valid}
      onReset={editor.reset}
      onSave={() => {
        editor.save();
        router.push(returnHref);
      }}
      actions={
        !editor.isNew && (
          <Button
            variant="outline"
            disabled={!editor.draft.name.trim()}
            onClick={() => {
              editor.duplicate();
              router.push(returnHref);
            }}
          >
            {t("appearance.theme.saveAs")}
          </Button>
        )
      }
    >
      <SubtitlePreviewWorkspace settings={editor.draft.settings} note={t("themeEditor.draftHint")}>
        <ThemeNameField value={editor.draft.name} valid={editor.valid} onChange={editor.setName} />
        {props.kind === "palette" ? (
          <div>
            <SubtitleColorPresets settings={editor.draft.settings} onChange={editor.update} />
            <SubtitlePaletteFields settings={editor.draft.settings} onChange={editor.update} />
          </div>
        ) : (
          <SubtitleStyleEditor settings={editor.draft.settings} onChange={editor.update} />
        )}
        <Button variant="ghost" onClick={editor.resetDefaults}>
          {t("appearance.reset")}
        </Button>
      </SubtitlePreviewWorkspace>
    </ThemeEditorFrame>
  );
}
