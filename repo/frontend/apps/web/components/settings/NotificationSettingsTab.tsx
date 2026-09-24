"use client";

import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { useI18n } from "@/store/module/i18n";
import { NotificationSubscriptions } from "./NotificationSubscriptions";
import { NotificationDeliverySettings } from "./NotificationDeliverySettings";
import { NotificationTestButton } from "./NotificationTestButton";
import { SettingInput, SettingRow, SettingSection } from "./SettingsUI";

export function NotificationSettingsTab() {
  const { t } = useI18n();
  const settings = useNotificationPreferences();
  const { snapshot, preferences, pending, localError, hasChanges, saving, testing } = settings;
  const disabled = pending || testing;
  if (!snapshot || !preferences)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t(localError ? "notifications.localError" : "notifications.checking")}
      </p>
    );
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
        <NotificationSubscriptions
          preferences={preferences}
          disabled={disabled}
          onChange={settings.change}
        />
        <div className="min-w-0 space-y-8">
          <NotificationDeliverySettings
            preferences={preferences}
            disabled={disabled}
            onChange={settings.change}
            desktopSupported={snapshot.desktopSupported}
          />
          <SettingSection title={t("notifications.schedule")}>
            <SettingRow
              label={t("notifications.dailyTime")}
              control={
                <label>
                  <span className="sr-only">{t("notifications.dailyTime")}</span>
                  <SettingInput
                    type="time"
                    className="w-36 min-w-36"
                    value={preferences.dailyTime}
                    disabled={disabled || !preferences.subscriptions.daily}
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
          {snapshot.desktopSupported && (
            <NotificationTestButton
              disabled={disabled || hasChanges || !snapshot.preferences.desktop}
              hasChanges={hasChanges}
              testing={testing}
              result={settings.testResult}
              onTest={() => void settings.test()}
            />
          )}
        </div>
      </div>
      {(hasChanges || saving) && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
          {localError ? (
            <p role="alert" className="text-sm text-danger">
              {t("notifications.localError")}
            </p>
          ) : hasChanges ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t("notifications.unsaved")}
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || !hasChanges}
            onClick={settings.reset}
          >
            {t("notifications.discard")}
          </Button>
          <Button
            type="button"
            disabled={disabled || !hasChanges}
            onClick={() => void settings.save()}
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t(saving ? "common.action.saving" : "settings.save")}
          </Button>
        </div>
      )}
    </div>
  );
}
