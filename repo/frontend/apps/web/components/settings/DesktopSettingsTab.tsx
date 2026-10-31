"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";

import { CircleCheck, CircleX, FileText, FolderOpen, LoaderCircle, Radio } from "lucide-react";
import { runtime } from "@/lib/runtime";
import { useTranslation } from "react-i18next";

import { useLogDirectory } from "@/hooks/settings/useLogDirectory";
import type { DesktopLogLevel } from "@scopify/desktop-contract";
import type { DesktopSettingsTabProps } from "@/types/settings/components";
import { AppUpdaterSection } from "./AppUpdaterSection";
import { DesktopLyricSection } from "./DesktopLyricSection";
import { DynamicIslandSection } from "./DynamicIslandSection";
import { LocalBackendSettingsSection } from "./LocalBackendSettingsSection";
import { McpSettingsSection } from "./McpSettingsSection";
import { SettingInput, SettingRow, SettingSection, Toggle } from "./SettingsUI";
import { TaskbarLyricSection } from "./TaskbarLyricSection";

export function DesktopSettingsTab({
  backendStatus,
  config,
  discordStatus,
  isTestingDiscord,
  mcpStatusRefreshKey,
  onChange,
  onTestDiscord,
}: DesktopSettingsTabProps) {
  const { t } = useTranslation();
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
      <LocalBackendSettingsSection
        backendStatus={backendStatus}
        config={config}
        onChange={onChange}
      />
      <SettingSection title={t("settings.section.logging")}>
        <SettingRow
          label={t("settings.logLevel.label")}
          sublabel={t("settings.logLevel.sublabel")}
          control={
            <Select
              value={String(config.logging.level)}
              onValueChange={(value) => onChange("logging", "level", value as DesktopLogLevel)}
            >
              <SelectTrigger aria-label={t("settings.logLevel.label")} className="min-w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="debug">{t("settings.logLevel.debug")}</SelectItem>
                <SelectItem value="info">{t("settings.logLevel.info")}</SelectItem>
                <SelectItem value="warn">{t("settings.logLevel.warn")}</SelectItem>
                <SelectItem value="error">{t("settings.logLevel.error")}</SelectItem>
              </SelectContent>
            </Select>
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
          label={t("settings.maxLogSize.label")}
          sublabel={t("settings.maxLogSize.sublabel")}
          control={
            <SettingInput
              type="number"
              value={config.logging.maxSizeMB}
              onChange={(value) => onChange("logging", "maxSizeMB", Number(value))}
            />
          }
        />
        <SettingRow
          label={t("settings.logDirectory.label")}
          sublabel={t("settings.logDirectory.sublabel")}
          isColumn
          control={
            <div className="w-full space-y-2">
              <code className="block w-full rounded border border-input bg-surface-sunken px-3 py-2 text-left text-xs font-medium break-all text-foreground">
                {logDirectory ??
                  (logDirectory === null
                    ? t("settings.logDirectory.unavailable")
                    : t("settings.logDirectory.loading"))}
              </code>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!logDirectory}
                  onClick={() => void runtime.logging.openCurrentFile()}
                  className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="size-4" />
                  {t("settings.logDirectory.openCurrent")}
                </button>
                <button
                  type="button"
                  disabled={!logDirectory}
                  onClick={() => void runtime.logging.openDirectory()}
                  className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FolderOpen className="size-4" />
                  {t("settings.logDirectory.openDirectory")}
                </button>
              </div>
            </div>
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
          label={t("settings.discord.test.label")}
          isDebug
          badge={
            <span
              aria-live="polite"
              className={
                hasDiscordConnection
                  ? "flex items-center gap-1 text-xs font-medium text-success"
                  : "flex items-center gap-1 text-xs font-medium text-muted-foreground"
              }
            >
              {hasDiscordConnection ? (
                <CircleCheck className="size-3.5" />
              ) : (
                <CircleX className="size-3.5" />
              )}
              {discordStatusLabel}
            </span>
          }
          sublabel={t("settings.discord.test.sublabel")}
          control={
            <button
              type="button"
              onClick={() => void onTestDiscord()}
              disabled={isTestingDiscord}
              className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-wait disabled:opacity-50"
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
      <DynamicIslandSection />
      <TaskbarLyricSection />
      <McpSettingsSection
        config={config.mcp}
        onChange={onChange}
        statusRefreshKey={mcpStatusRefreshKey}
      />
      <AppUpdaterSection config={config} onChange={onChange} />
    </div>
  );
}
