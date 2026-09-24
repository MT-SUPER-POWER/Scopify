"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import { useI18n } from "@/store/module/i18n";
import type { NotificationDeliverySettingsProps } from "@/types/components/notifications";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function NotificationDeliverySettings({
  preferences,
  disabled,
  onChange,
  desktopSupported,
}: NotificationDeliverySettingsProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("notifications.interruption")}>
      <SettingRow
        label={t("notifications.desktop")}
        sublabel={t(desktopSupported ? "notifications.desktopHint" : "notifications.webHint")}
        control={
          <Switch
            aria-label={t("notifications.desktop")}
            disabled={disabled || !desktopSupported}
            checked={preferences.desktop}
            onCheckedChange={(desktop) => onChange({ desktop })}
          />
        }
      />
      <SettingRow
        label={t("notifications.sound")}
        control={
          <Switch
            aria-label={t("notifications.sound")}
            disabled={disabled || !desktopSupported || !preferences.desktop}
            checked={preferences.sound}
            onCheckedChange={(sound) => onChange({ sound })}
          />
        }
      />
      <SettingRow
        label={t("notifications.preview")}
        sublabel={t("notifications.previewHint")}
        control={
          <Switch
            aria-label={t("notifications.preview")}
            disabled={disabled || !desktopSupported || !preferences.desktop}
            checked={preferences.preview}
            onCheckedChange={(preview) => onChange({ preview })}
          />
        }
      />
      <SettingRow
        label={t("notifications.dnd")}
        control={
          <Switch
            aria-label={t("notifications.dnd")}
            disabled={disabled}
            checked={preferences.doNotDisturb}
            onCheckedChange={(doNotDisturb) => onChange({ doNotDisturb })}
          />
        }
      />
      <SettingRow
        label={t("notifications.quietHours")}
        sublabel={t("notifications.quietHint")}
        control={
          <Switch
            aria-label={t("notifications.quietHours")}
            disabled={disabled}
            checked={preferences.quietHours}
            onCheckedChange={(quietHours) => onChange({ quietHours })}
          />
        }
      />
      {preferences.quietHours && (
        <div className="mb-6 flex flex-wrap gap-6 rounded-xl bg-surface-sunken p-4">
          <label className="flex items-center gap-3 text-sm text-foreground">
            {t("notifications.start")}
            <SettingInput
              type="time"
              value={preferences.quietStart}
              disabled={disabled}
              onChange={(quietStart) => {
                if (quietStart) onChange({ quietStart });
              }}
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            {t("notifications.end")}
            <SettingInput
              type="time"
              value={preferences.quietEnd}
              disabled={disabled}
              onChange={(quietEnd) => {
                if (quietEnd) onChange({ quietEnd });
              }}
            />
          </label>
        </div>
      )}
    </SettingSection>
  );
}
