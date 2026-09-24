"use client";

import { CURRENT_DEVICE_PREVIEW, OTHER_DEVICE_PREVIEWS } from "@/constants/loginDevices";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceStageProps } from "@/types/components/loginDevices";
import { DeviceIllustration } from "./DeviceIllustration";
import styles from "./LoginDevices.module.css";

export function LoginDeviceStage({ selectedDevice, onSelect }: LoginDeviceStageProps) {
  const { t } = useI18n();
  return (
    <div className={styles.stageScroller}>
      <div className={styles.stage} role="group" aria-label={t("devices.all")}>
        {[CURRENT_DEVICE_PREVIEW, ...OTHER_DEVICE_PREVIEWS.slice(0, 3)].map((device) => (
          <button
            key={device.id}
            type="button"
            className={styles.stageDevice}
            data-kind={device.kind}
            aria-pressed={selectedDevice.id === device.id}
            onClick={() => onSelect(device)}
          >
            <div className={styles.stageHardware}>
              <DeviceIllustration kind={device.kind} tone={device.tone} hero />
            </div>
            <span className={styles.stageLabel}>
              <strong>{device.current ? "Windows" : device.name}</strong>
              <span data-current={device.current || undefined}>
                {device.current
                  ? t("devices.current")
                  : `${t(device.activityKey)} · ${t(device.regionKey)}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
