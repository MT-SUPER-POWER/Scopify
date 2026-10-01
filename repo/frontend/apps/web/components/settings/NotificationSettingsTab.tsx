"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { runtime } from "@/lib/runtime";
import { useI18n } from "@/store/module/i18n";
import { NotificationSubscriptions } from "./NotificationSubscriptions";
import { NotificationDeliverySettings } from "./NotificationDeliverySettings";
import { NotificationTestButton } from "./NotificationTestButton";
import {
  SaveChangesButton,
  SaveConfirmModal,
  SettingInput,
  SettingRow,
  SettingSection,
} from "./SettingsUI";

export function NotificationSettingsTab() {
  const { t } = useI18n();
  const settings = useNotificationPreferences();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { snapshot, preferences, pending, localError, hasChanges, saving, testing } = settings;
  const disabled = pending || testing;
  if (!snapshot || !preferences)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t(localError ? "notifications.localError" : "notifications.checking")}
      </p>
    );

  const handleConfirmSave = async () => {
    await settings.save();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
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
      <SaveChangesButton visible={hasChanges} onClick={() => setIsModalOpen(true)} />
      <SaveConfirmModal
        open={isModalOpen}
        isSaving={saving}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => void handleConfirmSave()}
        requiresRestart={false}
        isWeb={!runtime.isDesktop}
      />
    </div>
  );
}
