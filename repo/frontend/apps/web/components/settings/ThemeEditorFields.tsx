import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFieldsProps } from "@/types/appearance";
import { ThemeColorControl } from "./ThemeColorControl";
import { AppearanceRange } from "./AppearanceRange";

export function ThemeEditorFields({ draft, onChange }: ThemeEditorFieldsProps) {
  const { t } = useI18n();
  return (
    <>
      <ThemeColorControl
        label={t("appearance.customTop")}
        value={draft.top}
        onChange={(top) => onChange({ ...draft, top })}
      />
      <ThemeColorControl
        label={t("appearance.customBottom")}
        value={draft.bottom}
        onChange={(bottom) => onChange({ ...draft, bottom })}
      />
      <div>
        <AppearanceRange
          label={t("appearance.intensity")}
          min={0}
          max={100}
          value={draft.intensity}
          unit="%"
          onChange={(intensity) => onChange({ ...draft, intensity })}
        />
        <AppearanceRange
          label={t("appearance.height")}
          min={160}
          max={720}
          step={10}
          value={draft.height}
          unit=" px"
          onChange={(height) => onChange({ ...draft, height })}
        />
      </div>
    </>
  );
}
