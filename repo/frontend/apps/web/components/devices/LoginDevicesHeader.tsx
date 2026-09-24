"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { LoginDevicesHeaderProps } from "@/types/components/loginDevices";
import styles from "./LoginDevices.module.css";
export function LoginDevicesHeader({
  allowance,
  refreshing,
  onRefresh,
  authenticated,
}: LoginDevicesHeaderProps) {
  const { t } = useI18n();
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1>{t("devices.title")}</h1>
        <div className={styles.headerMeta}>
          {allowance && (
            <span className={styles.allowance}>
              {t("devices.allowance")} <strong>{allowance.used}</strong>
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
      <p>{t("devices.subtitle")}</p>
    </header>
  );
}
