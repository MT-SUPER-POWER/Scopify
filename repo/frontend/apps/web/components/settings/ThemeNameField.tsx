import { useId } from "react";
import { Input } from "@scopify/ui/shadcn/components/input";
import { useI18n } from "@/store/module/i18n";
import type { ThemeNameFieldProps } from "@/types/appearance-theme-editor";

export function ThemeNameField({ value, valid, onChange }: ThemeNameFieldProps) {
  const { t } = useI18n();
  const id = useId();
  return (
    <div className="mb-6 space-y-3">
      <label htmlFor={id} className="text-base font-medium">
        {t("appearance.theme.name")}
      </label>
      <Input
        id={id}
        maxLength={40}
        value={value}
        aria-invalid={!valid}
        aria-describedby={!valid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("appearance.theme.placeholder")}
      />
      {!valid && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {t("appearance.theme.nameError")}
        </p>
      )}
    </div>
  );
}
