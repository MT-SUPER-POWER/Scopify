"use client";

import { Pencil } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceCardProps } from "@/types/components/loginDevices";
import { DeviceIllustration } from "./DeviceIllustration";
import styles from "./LoginDevices.module.css";

export function CurrentDeviceCard({ device, onSelect, onRename }: LoginDeviceCardProps) {
  const { t } = useI18n();
  return (
    <section className={styles.currentCard} aria-label={device.name} aria-live="polite">
      <div className={styles.currentThumbnail}>
        <DeviceIllustration kind={device.kind} tone={device.tone} />
      </div>
      <div className={styles.currentCopy}>
        <div className={styles.deviceTitle}>
          <h2>{device.name}</h2>
          {device.current && <span className={styles.currentBadge}>{t("devices.current")}</span>}
        </div>
        <p>
          {t("devices.lastActive")}
          <span>
            {device.activity} · {device.region}
          </span>
        </p>
        <p>
          {t("devices.platform")}
          <span>{device.platform}</span>
        </p>
        <button type="button" onClick={() => onSelect(device)} className={styles.textAction}>
          {t("devices.viewDetails")}
        </button>
      </div>
      <div className={styles.currentDescription}>
        <p>{t(device.current ? "devices.currentNote" : "devices.othersNote")}</p>
      </div>
      {device.current ? (
        <Button variant="outline" onClick={() => onRename?.(device)} className="rounded-full">
          <Pencil className="size-3.5" />
          {t("devices.rename")}
        </Button>
      ) : (
        <Button variant="outline" className="rounded-full" onClick={() => onSelect(device)}>
          {t("devices.viewDetails")}
        </Button>
      )}
    </section>
  );
}
