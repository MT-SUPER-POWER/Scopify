"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useDevicePresentation } from "@/hooks/devices/useDevicePresentation";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceContentProps } from "@/types/components/loginDevices";
import { CurrentDeviceCard } from "./CurrentDeviceCard";
import { LoginDeviceStage } from "./LoginDeviceStage";
import { LoginDeviceCard } from "./LoginDeviceCard";
import { LoginDeviceDetails } from "./LoginDeviceDetails";
import { DeviceActionDialog } from "./DeviceActionDialog";
import styles from "./LoginDevices.module.css";
export function LoginDevicesContent({ snapshot, scope }: LoginDeviceContentProps) {
  const { t } = useI18n();
  const state = useDevicePresentation(snapshot.devices);
  return (
    <>
      <div className={styles.tabs} role="group" aria-label={t("devices.title")}>
        {(["all", "activity"] as const).map((view) => (
          <button
            type="button"
            key={view}
            aria-pressed={state.view === view}
            onClick={() => state.setView(view)}
          >
            {t(view === "all" ? "devices.all" : "devices.lastActive")}
          </button>
        ))}
      </div>
      {state.view === "all" && state.selected && (
        <>
          <LoginDeviceStage
            devices={snapshot.devices}
            selectedDevice={state.selected}
            onSelect={state.select}
          />
          <CurrentDeviceCard
            device={state.selected}
            onSelect={state.openDetails}
            onRename={(device) => state.setAction({ type: "rename", device })}
          />
        </>
      )}
      <section className={styles.otherSection} aria-labelledby="other-devices-title">
        <div className={styles.sectionHeader}>
          <h2 id="other-devices-title">
            {t(state.view === "all" ? "devices.others" : "devices.lastActive")}
          </h2>
          <span>{t("devices.recordCount", { count: snapshot.devices.length })}</span>
        </div>
        {state.visibleDevices.length ? (
          <ul className={styles.deviceList}>
            {state.visibleDevices.map((device) => (
              <LoginDeviceCard key={device.id} device={device} onSelect={state.openDetails} />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">{t("devices.noOthers")}</p>
        )}
        {state.view === "all" && state.hasMore && (
          <div className={styles.more}>
            <Button variant="ghost" onClick={() => state.setExpanded(!state.expanded)}>
              {t(state.expanded ? "devices.less" : "devices.more")}
              <ChevronDown className={state.expanded ? "size-4 rotate-180" : "size-4"} />
            </Button>
          </div>
        )}
      </section>
      <LoginDeviceDetails
        device={state.details}
        onClose={state.closeDetails}
        onAction={(action) => {
          state.closeDetails();
          state.setAction(action);
        }}
      />
      <DeviceActionDialog
        key={state.action?.device.id + ":" + state.action?.type}
        action={state.action}
        scope={scope}
        onClose={() => state.setAction(null)}
      />
    </>
  );
}
