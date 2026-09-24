"use client";

import { Info } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import styles from "./LoginDevices.module.css";

export function LoginDevicesHeader() {
  const { t } = useI18n();
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1>{t("devices.title")}</h1>
        <div className={styles.headerMeta}>
          <span className={styles.previewBadge} title={t("devices.previewNote")}>
            <Info />
            {t("devices.preview")}
          </span>
          <span className={styles.allowance} title={t("devices.allowanceNote")}>
            {t("devices.allowance")} <strong>5</strong>
            <span>/ 8</span>
          </span>
        </div>
      </div>
      <p>{t("devices.subtitle")}</p>
    </header>
  );
}
