import { backgroundGradient } from "@/lib/settings/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorFieldsProps } from "@/types/appearance";
import { AppearanceRange } from "./AppearanceRange";

export function ThemeEditorFields({ draft, onChange }: ThemeEditorFieldsProps) {
  const { t } = useI18n();
  return (
    <>
      <div className="relative flex h-32 items-end overflow-hidden rounded-lg bg-surface-raised p-5">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{
            height: draft.height / 2,
            opacity: draft.intensity / 100,
            background: backgroundGradient(draft.top, draft.bottom),
          }}
        />
        <span className="relative text-xl font-semibold text-foreground">
          {draft.name || t("appearance.library.new")}
        </span>
      </div>
      <label className="space-y-2 text-sm text-foreground">
        <span>{t("appearance.theme.name")}</span>
        <input
          autoFocus
          maxLength={40}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder={t("appearance.theme.placeholder")}
          className="mt-2 h-10 w-full rounded border border-input bg-transparent px-3 outline-none focus:border-ring"
        />
      </label>
      <div className="grid grid-cols-2 gap-4 py-2">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="color"
            value={draft.top}
            onChange={(event) => onChange({ ...draft, top: event.target.value })}
            className="size-10 cursor-pointer rounded border border-input bg-transparent p-1"
          />
          {t("appearance.customTop")}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="color"
            value={draft.bottom}
            onChange={(event) => onChange({ ...draft, bottom: event.target.value })}
            className="size-10 cursor-pointer rounded border border-input bg-transparent p-1"
          />
          {t("appearance.customBottom")}
        </label>
      </div>
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
