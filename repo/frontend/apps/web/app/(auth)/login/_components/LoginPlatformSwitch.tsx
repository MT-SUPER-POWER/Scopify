"use client";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMusicProvider } from "@/lib/auth/loginPlatform";

import type { LoginPlatformSwitchProps } from "@/types/auth/qqLogin";

/** Chooses which platform this login is for. */
export function LoginPlatformSwitch({ value, disabled, onChange }: LoginPlatformSwitchProps) {
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (isMusicProvider(next)) onChange(next);
      }}
      className="mb-3 w-full"
    >
      <TabsList
        aria-label={t("login.platform.label")}
        className="grid h-10 w-full grid-cols-2 rounded-xl border border-content/5 bg-content/5 p-1"
      >
        <TabsTrigger
          value="netease"
          disabled={disabled}
          className="rounded-lg text-xs data-[state=active]:bg-surface-elevated"
        >
          {t("login.platform.netease")}
        </TabsTrigger>
        <TabsTrigger
          value="qq"
          disabled={disabled}
          className="rounded-lg text-xs data-[state=active]:bg-surface-elevated"
        >
          {t("login.platform.qq")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
