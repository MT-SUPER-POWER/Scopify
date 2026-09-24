"use client";

import { Switch } from "@scopify/ui/shadcn/components/switch";
import { useI18n } from "@/store/module/i18n";
import type { NotificationPreferenceSectionProps } from "@/types/components/notifications";
import { SettingRow, SettingSection } from "./SettingsUI";

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
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("notifications.subscriptionHint")}
      </p>
      {SOURCES.map((source) => (
        <SettingRow
          key={source}
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
