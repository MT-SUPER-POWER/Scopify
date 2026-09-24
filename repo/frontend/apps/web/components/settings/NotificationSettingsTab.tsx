"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { useI18n } from "@/store/module/i18n";
import { NotificationSubscriptions } from "./NotificationSubscriptions";
import { NotificationDeliverySettings } from "./NotificationDeliverySettings";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function NotificationSettingsTab() {
  const { t } = useI18n();
  const settings = useNotificationPreferences();
  const { snapshot, pending, localError } = settings;
  if (!snapshot)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t(localError ? "notifications.localError" : "notifications.checking")}
      </p>
    );
  return (
    <div className="max-w-3xl space-y-8">
      <div className="rounded-2xl border border-border bg-surface-sunken/50 p-5">
        <p className="text-sm text-foreground">{t("notifications.preferencesHint")}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("notifications.scopeHint")}
        </p>
      </div>
      {localError && (
        <p role="alert" className="text-sm text-danger">
          {t("notifications.localError")}
        </p>
      )}
      <NotificationSubscriptions
        preferences={snapshot.preferences}
        disabled={pending}
        onChange={settings.change}
      />
      <NotificationDeliverySettings
        preferences={snapshot.preferences}
        disabled={pending}
        onChange={settings.change}
        desktopSupported={snapshot.desktopSupported}
      />
      {snapshot.desktopSupported && (
        <div>
          <button
            type="button"
            disabled={pending || settings.testing || !snapshot.preferences.desktop}
            onClick={() => void settings.test()}
            className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-40"
          >
            {settings.testing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {t("notifications.test")}
          </button>
          {settings.testResult && (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {t(
                settings.testResult === "sent"
                  ? "notifications.testSent"
                  : "notifications.testBlocked",
              )}
            </p>
          )}
        </div>
      )}
      <SettingSection title={t("notifications.schedule")}>
        <SettingRow
          label={t("notifications.dailyTime")}
          control={
            <label>
              <span className="sr-only">{t("notifications.dailyTime")}</span>
              <SettingInput
                type="time"
                value={snapshot.preferences.dailyTime}
                disabled={pending || !snapshot.preferences.subscriptions.daily}
                onChange={(dailyTime) => {
                  if (dailyTime) settings.change({ dailyTime });
                }}
              />
            </label>
          }
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("notifications.scheduleHint")}
        </p>
      </SettingSection>
    </div>
  );
}
