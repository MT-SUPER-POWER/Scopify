"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useDevicePreview } from "@/hooks/devices/useDevicePreview";
import { useI18n } from "@/store/module/i18n";
import { CurrentDeviceCard } from "./CurrentDeviceCard";
import { LoginDeviceStage } from "./LoginDeviceStage";
import { LoginDeviceCard } from "./LoginDeviceCard";
import { LoginDeviceDetails } from "./LoginDeviceDetails";
import styles from "./LoginDevices.module.css";

export function LoginDevicesPreview() {
  const { t } = useI18n();
  const preview = useDevicePreview();
  return (
    <>
      <div className={styles.tabs} role="group" aria-label={t("devices.title")}>
        {(["all", "activity"] as const).map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={preview.view === view}
            onClick={() => preview.setView(view)}
          >
            {t(view === "all" ? "devices.all" : "devices.lastActive")}
          </button>
        ))}
      </div>
      {preview.view === "all" && (
        <>
          <LoginDeviceStage
            selectedDevice={preview.selectedDevice}
            onSelect={preview.setSelectedDevice}
          />
          <CurrentDeviceCard device={preview.selectedDevice} onSelect={preview.setDetailsDevice} />
        </>
      )}
      <section className={styles.otherSection} aria-labelledby="other-devices-title">
        <div className={styles.sectionHeader}>
          <h2 id="other-devices-title">
            {t(preview.view === "all" ? "devices.others" : "devices.lastActive")}
          </h2>
          <span>{t("devices.previewNote")}</span>
        </div>
        <ul className={styles.deviceList}>
          {preview.visibleDevices.map((device) => (
            <LoginDeviceCard key={device.id} device={device} onSelect={preview.setDetailsDevice} />
          ))}
        </ul>
        {preview.view === "all" && (
          <div className={styles.more}>
            <Button
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() => preview.setExpanded(!preview.expanded)}
            >
              {t(preview.expanded ? "devices.less" : "devices.more")}
              <ChevronDown
                className={`size-3.5 transition-transform ${preview.expanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        )}
      </section>
      <LoginDeviceDetails
        device={preview.detailsDevice}
        onClose={() => preview.setDetailsDevice(null)}
      />
    </>
  );
}
