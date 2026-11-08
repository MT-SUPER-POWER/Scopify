"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { useTranslation } from "react-i18next";
import { useSettingsState } from "@/hooks/settings/useSettingsState";
import { runtime } from "@/lib/runtime";

import type { BackendPlatform } from "@/types/settings/config";
import {
  SaveChangesButton,
  SaveConfirmModal,
  SettingRow,
  SettingsLoadingState,
} from "@/components/settings/SettingsUI";
import { BackendSourceCard } from "./BackendSourceCard";

const PLATFORMS: readonly BackendPlatform[] = ["netease", "qq"];

/**
 * Advanced backend settings: one card per platform with its source and address, plus the
 * request options only that platform understands. Saves through the same flow as the main
 * settings page.
 */
export function BackendSettingsPage() {
  const { t } = useTranslation();
  const settings = useSettingsState();
  const { config } = settings;

  if (!config) return <SettingsLoadingState />;

  return (
    <div className="flex flex-col pb-10 md:pb-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          {t("settings.backendSettings.title")}
        </h1>
      </div>
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 pb-32 lg:grid-cols-2">
        {PLATFORMS.map((platform) => (
          <BackendSourceCard
            key={platform}
            platform={platform}
            desktopConfig={config.desktop}
            backendStatus={settings.backendStatuses[platform]}
            onDesktopChange={settings.handleDesktopChange}
            custom={{
              address: config.web.backend[platform],
              pingResult: settings.backendPingResults[platform],
              isPinging: settings.pingingBackends[platform],
              onChange: (key, value) => settings.handleBackendAddressChange(platform, key, value),
              onPing: () => settings.handlePingBackend(platform),
              onHostBlur: () => settings.handleBackendHostBlur(platform),
            }}
          >
            {platform === "netease" ? (
              <SettingRow
                label={t("settings.randomCNIP.label")}
                sublabel={t("settings.randomCNIP.sublabel")}
                control={
                  <Select
                    value={config.web.netease.randomCNIP}
                    onValueChange={(value) =>
                      settings.handleWebChange(
                        "netease",
                        "randomCNIP",
                        value === "true" ? "true" : "false",
                      )
                    }
                  >
                    <SelectTrigger aria-label={t("settings.randomCNIP.label")} className="min-w-30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="false">{t("settings.randomCNIP.disabled")}</SelectItem>
                      <SelectItem value="true">{t("settings.randomCNIP.enabled")}</SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            ) : null}
          </BackendSourceCard>
        ))}
      </div>
      <SaveChangesButton
        visible={settings.hasChanges}
        onSave={() => settings.setIsModalOpen(true)}
        onDiscard={() => settings.handleDiscardChanges()}
        isSaving={settings.isSaving}
      />
      <SaveConfirmModal
        open={settings.isModalOpen}
        isSaving={settings.isSaving}
        onClose={() => settings.setIsModalOpen(false)}
        onConfirm={() => void settings.handleConfirmSave()}
        requiresRestart={settings.requiresRestart}
        isWeb={!runtime.isDesktop}
      />
    </div>
  );
}
