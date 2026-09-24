"use client";

import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceStageProps } from "@/types/components/loginDevices";
import { DeviceIllustration } from "./DeviceIllustration";
import styles from "./LoginDevices.module.css";

export function LoginDeviceStage({ devices, selectedDevice, onSelect }: LoginDeviceStageProps) {
  const { t } = useI18n();
  return (
    <div className={styles.stageScroller}>
      <div
        className={styles.stage}
        data-count={Math.min(devices.length, 4)}
        role="group"
        aria-label={t("devices.all")}
      >
        {devices.slice(0, 4).map((device) => (
          <button
            key={device.id}
            type="button"
            className={styles.stageDevice}
            data-kind={device.kind}
            title={device.name}
            aria-pressed={selectedDevice.id === device.id}
            onClick={() => onSelect(device)}
          >
            <div className={styles.stageHardware}>
              <DeviceIllustration kind={device.kind} tone={device.tone} hero />
            </div>
            <span className={styles.stageLabel}>
              <strong>{device.name}</strong>
              <span data-current={device.current || undefined}>
                {device.current ? t("devices.current") : `${device.activity} · ${device.region}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
