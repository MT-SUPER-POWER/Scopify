"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import { useI18n } from "@/store/module/i18n";
import type { NotificationDeliverySettingsProps } from "@/types/components/notifications";
import { NotificationTestButton } from "./NotificationTestButton";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function NotificationDeliverySettings({
  preferences,
  disabled,
  onChange,
  desktopSupported,
  hasChanges,
  testing,
  onTest,
}: NotificationDeliverySettingsProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("notifications.interruption")}>
      <SettingRow
        label={t("notifications.desktop")}
        sublabel={desktopSupported ? undefined : t("notifications.webHint")}
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
        <div className="mb-6 flex flex-wrap gap-4 rounded-xl bg-surface-sunken p-4">
          <label className="flex items-center gap-3 text-sm text-foreground">
            {t("notifications.start")}
            <SettingInput
              type="time"
              className="w-36 min-w-36"
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
              className="w-36 min-w-36"
              value={preferences.quietEnd}
              disabled={disabled}
              onChange={(quietEnd) => {
                if (quietEnd) onChange({ quietEnd });
              }}
            />
          </label>
          <p className="w-full text-xs text-muted-foreground">{t("notifications.quietHint")}</p>
        </div>
      )}
      {process.env.NODE_ENV !== "production" && desktopSupported && onTest && (
        <div className="mt-4 border-t border-border/40 pt-4">
          <SettingRow
            label={t("notifications.testDesktopLabel")}
            isDebug
            sublabel={t("notifications.testDesktopSublabel")}
            control={
              <NotificationTestButton
                disabled={disabled || Boolean(hasChanges) || !preferences.desktop}
                testing={Boolean(testing)}
                onTest={onTest}
              />
            }
          />
        </div>
      )}
    </SettingSection>
  );
}
