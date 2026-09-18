import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFieldsProps } from "@/types/appearance";
import { SettingRow } from "./SettingsUI";
import { ThemeColorControl } from "./ThemeColorControl";
import { AppearanceRange } from "./AppearanceRange";

export function ThemeEditorFields({ draft, onChange, readOnly = false }: ThemeEditorFieldsProps) {
  const { t } = useI18n();
  return (
    <>
      <ThemeColorControl
        readOnly={readOnly}
        label={t("appearance.customTop")}
        value={draft.top}
        onChange={(top) => onChange({ ...draft, top })}
      />
      <ThemeColorControl
        readOnly={readOnly}
        label={t("appearance.customBottom")}
        value={draft.bottom}
        onChange={(bottom) => onChange({ ...draft, bottom })}
      />
      {readOnly ? (
        <>
          <SettingRow label={t("appearance.intensity")} control={`${draft.intensity}%`} />
          <SettingRow label={t("appearance.height")} control={`${draft.height} px`} />
        </>
      ) : (
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
      )}
    </>
  );
}
