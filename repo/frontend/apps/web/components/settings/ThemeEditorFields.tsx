import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFieldsProps } from "@/types/appearance/model";
import { SettingRow } from "./SettingsUI";
import { ThemeColorControl } from "./ThemeColorControl";
import { AppearanceRange } from "./AppearanceRange";

export function ThemeEditorFields({
  draft,
  onChange,
  readOnly = false,
  variant,
  onVariantChange,
}: ThemeEditorFieldsProps) {
  const { t } = useI18n();
  return (
    <>
      <div role="group" aria-label={t("settings.appearance.label")} className="mb-4 flex gap-2">
        {(["light", "dark"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={variant === mode}
            onClick={() => onVariantChange(mode)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${variant === mode ? "border-brand bg-brand/10 text-brand" : "border-border text-content-muted hover:bg-content/5"}`}
          >
            {t(mode === "light" ? "settings.appearance.light" : "settings.appearance.dark")}
          </button>
        ))}
      </div>
      <ThemeColorControl
        readOnly={readOnly}
        label={t("appearance.customTop")}
        value={draft[variant].top}
        onChange={(top) => onChange({ ...draft, [variant]: { ...draft[variant], top } })}
      />
      <ThemeColorControl
        readOnly={readOnly}
        label={t("appearance.customBottom")}
        value={draft[variant].bottom}
        onChange={(bottom) => onChange({ ...draft, [variant]: { ...draft[variant], bottom } })}
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
