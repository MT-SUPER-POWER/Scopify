"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShortcutSettings } from "@/components/shortcuts/ShortcutSettings";
import { SETTINGS_TABS } from "@/constants/settings";
import { useSettingsState } from "@/hooks/settings/useSettingsState";
import { runtime } from "@/lib/runtime";
import { parseSettingsTab } from "@/lib/settings/tabs";
import { useI18n } from "@/store/module/i18n";
import type { SettingsTabId } from "@/types/settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DesktopSettingsTab } from "./DesktopSettingsTab";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { NetworkSettingsTab } from "./NetworkSettingsTab";
import { SaveChangesButton, SaveConfirmModal, SettingsLoadingState } from "./SettingsUI";
import { StorageSettingsTab } from "./StorageSettingsTab";

const SettingsPage = () => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryTab = parseSettingsTab(searchParams.get("tab") ?? undefined);
  const [activeTab, setActiveTab] = useState(queryTab);
  const settings = useSettingsState();

  useEffect(() => setActiveTab(queryTab), [queryTab]);

  if (!settings.config) return <SettingsLoadingState />;

  const handleTabChange = (tab: string) => {
    const nextTab = tab as SettingsTabId;
    setActiveTab(nextTab);
    router.replace(`${pathname}?tab=${nextTab}`, { scroll: false });
  };

  return (
    <div className="relative flex w-full flex-col p-6 text-muted-foreground md:p-10">
      <div className="mt-4 mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          {t("settings.title")}
        </h1>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
        <TabsList className="h-auto w-fit max-w-full justify-start gap-1 self-start overflow-x-auto bg-surface-sunken p-1">
          {SETTINGS_TABS.filter((tab) => tab.id !== "desktop" || runtime.isDesktop).map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="shrink-0 px-4 py-2">
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="py-8 pb-12">
          <TabsContent value="general">
            <GeneralSettingsTab
              config={settings.config}
              onWebChange={settings.handleWebChange}
              onDesktopChange={settings.handleDesktopChange}
            />
          </TabsContent>
          <TabsContent value="network">
            <NetworkSettingsTab
              backendPingResult={settings.backendPingResult}
              config={settings.config}
              isPingingBackend={settings.isPingingBackend}
              onWebChange={settings.handleWebChange}
              onDesktopChange={settings.handleDesktopChange}
              onPingBackend={settings.handlePingBackend}
              onBackendHostBlur={settings.handleBackendHostBlur}
            />
          </TabsContent>
          <TabsContent value="storage">
            <StorageSettingsTab
              config={settings.config.desktop}
              onChange={settings.handleDesktopChange}
              cacheStats={settings.cacheStats}
              cachePreferences={settings.cachePreferences}
              onCachePreferencesChange={settings.handleCachePreferencesChange}
            />
          </TabsContent>
          {settings.config.desktop ? (
            <TabsContent value="desktop">
              <DesktopSettingsTab
                backendStatus={settings.backendStatus}
                config={settings.config.desktop}
                discordStatus={settings.discordStatus}
                isTestingDiscord={settings.isTestingDiscord}
                onChange={settings.handleDesktopChange}
                onTestDiscord={settings.handleTestDiscord}
              />
            </TabsContent>
          ) : null}
          <TabsContent value="shortcuts">
            <ShortcutSettings />
          </TabsContent>
        </div>
      </Tabs>
      <SaveChangesButton
        visible={settings.hasChanges}
        onClick={() => settings.setIsModalOpen(true)}
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
};

export default SettingsPage;
