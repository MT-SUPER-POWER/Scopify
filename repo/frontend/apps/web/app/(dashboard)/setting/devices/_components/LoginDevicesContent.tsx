"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useDevicePresentation } from "@/hooks/devices/useDevicePresentation";
import { useTranslation } from "react-i18next";

import type { LoginDeviceContentProps } from "@/types/devices/components";
import { CurrentDeviceCard } from "./CurrentDeviceCard";
import { LoginDeviceStage } from "./LoginDeviceStage";
import { LoginDeviceCard } from "./LoginDeviceCard";
import { LoginDeviceDetails } from "./LoginDeviceDetails";
import { DeviceActionDialog } from "./DeviceActionDialog";
const tabClass =
  "cursor-pointer border-b-2 border-b-transparent px-[15px] py-3 text-[14px] font-[550] text-muted-foreground hover:text-foreground aria-pressed:border-b-primary aria-pressed:text-primary aria-pressed:hover:text-foreground";
export function LoginDevicesContent({ snapshot, scope }: LoginDeviceContentProps) {
  const { t } = useTranslation();
  const state = useDevicePresentation(snapshot.devices);
  return (
    <>
      <div className="flex gap-5 px-2" role="group" aria-label={t("devices.title")}>
        {(["all", "activity"] as const).map((view) => (
          <button
            type="button"
            key={view}
            className={tabClass}
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
      <section className="mt-[26px]" aria-labelledby="other-devices-title">
        <div className="mb-3 flex items-baseline justify-between gap-4 @max-[640px]:flex-col @max-[640px]:items-start @max-[640px]:gap-1.5">
          <h2 id="other-devices-title" className="text-[16px] font-[650]">
            {t(state.view === "all" ? "devices.others" : "devices.lastActive")}
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {t("devices.recordCount", { count: snapshot.devices.length })}
          </span>
        </div>
        {state.visibleDevices.length ? (
          <ul className="overflow-hidden rounded-[16px] border border-border px-[18px] max-[700px]:px-2.5">
            {state.visibleDevices.map((device) => (
              <LoginDeviceCard key={device.id} device={device} onSelect={state.openDetails} />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-sm text-muted-foreground">{t("devices.noOthers")}</p>
        )}
        {state.view === "all" && state.hasMore && (
          <div className="mt-2.5 text-center">
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
