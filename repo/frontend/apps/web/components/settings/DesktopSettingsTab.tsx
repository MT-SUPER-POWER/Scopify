"use client";

import { CircleCheck, CircleX, LoaderCircle, Radio } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import { useLogDirectory } from "@/hooks/settings/useLogDirectory";
import type { DesktopLogLevel } from "@scopify/desktop-contract";
import type { DesktopSettingsTabProps } from "@/types/components/settings";
import { AppUpdaterSection } from "./AppUpdaterSection";
import { DesktopLyricSection } from "./DesktopLyricSection";
import { SettingInput, SettingRow, SettingSection, SettingSelect, Toggle } from "./SettingsUI";

export function DesktopSettingsTab({
  config,
  discordStatus,
  isTestingDiscord,
  onChange,
  onTestDiscord,
}: DesktopSettingsTabProps) {
  const { t } = useI18n();
  const logDirectory = useLogDirectory();
  const discordStatusLabel = !discordStatus
    ? t("settings.discord.status.unknown")
    : discordStatus.connected
      ? t("settings.discord.status.connected")
      : !discordStatus.enabled
        ? t("settings.discord.status.disabled")
        : !discordStatus.configured
          ? t("settings.discord.status.applicationIdRequired")
          : t("settings.discord.status.disconnected");
  const hasDiscordConnection = Boolean(discordStatus?.connected);

  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 lg:grid-cols-2">
      <SettingSection title={t("settings.section.logging")}>
        <SettingRow
          label={t("settings.logLevel.label")}
          sublabel={t("settings.logLevel.sublabel")}
          control={
            <SettingSelect
              value={config.logging.level}
              onChange={(value) => onChange("logging", "level", value as DesktopLogLevel)}
            >
              <option value="debug" className="bg-popover">
                {t("settings.logLevel.debug")}
              </option>
              <option value="info" className="bg-popover">
                {t("settings.logLevel.info")}
              </option>
              <option value="warn" className="bg-popover">
                {t("settings.logLevel.warn")}
              </option>
              <option value="error" className="bg-popover">
                {t("settings.logLevel.error")}
              </option>
            </SettingSelect>
          }
        />
        <SettingRow
          label={t("settings.keepDays.label")}
          sublabel={t("settings.keepDays.sublabel")}
          control={
            <SettingInput
              type="number"
              value={config.logging.keepDays}
              onChange={(value) => onChange("logging", "keepDays", Number(value))}
            />
          }
        />
        <SettingRow
          label={t("settings.logDirectory.label")}
          sublabel={t("settings.logDirectory.sublabel")}
          isColumn
          control={
            <code className="border-input bg-surface-sunken text-foreground block w-full rounded border px-3 py-2 text-left text-xs font-medium break-all">
              {logDirectory ??
                (logDirectory === null
                  ? t("settings.logDirectory.unavailable")
                  : t("settings.logDirectory.loading"))}
            </code>
          }
        />
      </SettingSection>
      <SettingSection title={t("settings.section.discord")}>
        <SettingRow
          label={t("settings.discord.enabled.label")}
          sublabel={t("settings.discord.enabled.sublabel")}
          control={
            <Toggle
              enabled={config.discord.enabled}
              onChange={() => onChange("discord", "enabled", !config.discord.enabled)}
            />
          }
        />
        <SettingRow
          label={t("settings.discord.applicationId.label")}
          sublabel={t("settings.discord.applicationId.sublabel")}
          isColumn
          control={
            <SettingInput
              className="w-full text-left"
              onChange={(value) => onChange("discord", "applicationId", value)}
              placeholder={t("settings.discord.applicationId.placeholder")}
              value={config.discord.applicationId}
            />
          }
        />
        <SettingRow
          label={
            <div className="flex items-center gap-2">
              <span>{t("settings.discord.test.label")}</span>
              <span
                aria-live="polite"
                className={
                  hasDiscordConnection
                    ? "text-success flex items-center gap-1 text-xs font-medium"
                    : "text-muted-foreground flex items-center gap-1 text-xs font-medium"
                }
              >
                {hasDiscordConnection ? (
                  <CircleCheck className="size-3.5" />
                ) : (
                  <CircleX className="size-3.5" />
                )}
                {discordStatusLabel}
              </span>
            </div>
          }
          sublabel={t("settings.discord.test.sublabel")}
          control={
            <button
              type="button"
              onClick={() => void onTestDiscord()}
              disabled={isTestingDiscord}
              className="border-input text-foreground hover:border-content inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-50"
            >
              {isTestingDiscord ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Radio className="size-4" />
              )}
              {isTestingDiscord
                ? t("settings.discord.test.testing")
                : t("settings.discord.test.button")}
            </button>
          }
        />
      </SettingSection>
      <DesktopLyricSection />
      <AppUpdaterSection config={config} onChange={onChange} />
    </div>
  );
}
