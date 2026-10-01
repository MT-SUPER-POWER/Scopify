"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import { useI18n } from "@/store/module/i18n";
import type { NotificationPreferenceSectionProps } from "@/types/components/notifications";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

const SOURCES = [
  "private",
  "comments",
  "mentions",
  "notices",
  "daily",
  "weekly",
  "yearly",
] as const;

export function NotificationSubscriptions({
  preferences,
  disabled,
  onChange,
}: NotificationPreferenceSectionProps) {
  const { t } = useI18n();
  return (
    <SettingSection title={t("notifications.subscriptions")}>
      {SOURCES.map((source) => (
        <div key={source} className="flex flex-col">
          <SettingRow
            label={t(`notifications.${source}`)}
            control={
              <Switch
                aria-label={t(`notifications.${source}`)}
                disabled={disabled}
                checked={preferences.subscriptions[source]}
                onCheckedChange={(checked) =>
                  onChange({ subscriptions: { ...preferences.subscriptions, [source]: checked } })
                }
              />
            }
          />
          {source === "daily" && preferences.subscriptions.daily && (
            <div className="-mt-1 mb-2.5 ml-4 flex items-center justify-between rounded-lg bg-surface-elevated/40 px-3.5 py-2 text-xs text-muted-foreground">
              <span>{t("notifications.dailyTime")}</span>
              <label>
                <span className="sr-only">{t("notifications.dailyTime")}</span>
                <SettingInput
                  type="time"
                  className="h-8 w-28 min-w-28 text-xs"
                  value={preferences.dailyTime}
                  disabled={disabled}
                  onChange={(dailyTime) => {
                    if (dailyTime) onChange({ dailyTime });
                  }}
                />
              </label>
            </div>
          )}
        </div>
      ))}
      <SettingRow
        label={t("notifications.updates")}
        control={
          <Switch
            aria-label={t("notifications.updates")}
            disabled={disabled}
            checked={preferences.updates}
            onCheckedChange={(updates) => onChange({ updates })}
          />
        }
      />
    </SettingSection>
  );
}
