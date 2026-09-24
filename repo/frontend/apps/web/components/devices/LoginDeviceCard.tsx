"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceCardProps } from "@/types/components/loginDevices";
import { DeviceIllustration } from "./DeviceIllustration";
import styles from "./LoginDevices.module.css";

export function LoginDeviceCard({ device, onSelect }: LoginDeviceCardProps) {
  const { t } = useI18n();
  return (
    <li className={styles.deviceRow}>
      <div className={styles.rowThumbnail}>
        <DeviceIllustration kind={device.kind} tone={device.tone} />
      </div>
      <div className={styles.rowCopy}>
        <h3>{device.name}</h3>
        <p>
          {device.activity}
          <span>·</span>
          {device.region}
          <span className={styles.rowPlatform}>{device.platform}</span>
        </p>
      </div>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => onSelect(device)}
        aria-label={`${device.name} · ${t("devices.viewDetails")}`}
      >
        <span className={styles.rowActionText}>{t("devices.viewDetails")}</span>
        <ArrowUpRight className="size-3.5" />
      </Button>
    </li>
  );
}
