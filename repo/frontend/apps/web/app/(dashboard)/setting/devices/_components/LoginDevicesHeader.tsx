"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useTranslation } from "react-i18next";

import type { LoginDevicesHeaderProps } from "@/types/devices/components";
export function LoginDevicesHeader({
  allowance,
  refreshing,
  onRefresh,
  authenticated,
}: LoginDevicesHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mx-2 mb-[18px] max-[700px]:mx-0">
      <div className="flex items-center justify-between gap-5 @max-[640px]:flex-col @max-[640px]:items-start @max-[640px]:gap-3">
        <h1 className="leading-1.2 text-[length:clamp(30px,3.2vw,42px)] font-extrabold -tracking-wider">
          {t("devices.title")}
        </h1>
        <div className="flex items-center gap-5 text-[12px] text-muted-foreground @max-[900px]:gap-2.5 @max-[640px]:w-full @max-[640px]:justify-between">
          {allowance && (
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              {t("devices.allowance")}{" "}
              <strong className="ml-0.5 text-[21px] font-[650] text-foreground">
                {allowance.used}
              </strong>
              <span>/ {allowance.limit}</span>
            </span>
          )}
          {authenticated && (
            <Button
              variant="ghost"
              size="icon"
              disabled={refreshing}
              onClick={onRefresh}
              aria-label={t("devices.refresh")}
            >
              <RefreshCw className={refreshing ? "size-4 animate-spin" : "size-4"} />
            </Button>
          )}
        </div>
      </div>
      <p className="leading-1.7 mt-3 text-[14px] text-muted-foreground">{t("devices.subtitle")}</p>
    </header>
  );
}
