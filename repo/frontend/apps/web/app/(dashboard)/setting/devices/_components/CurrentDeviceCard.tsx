"use client";

import { Pencil } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useTranslation } from "react-i18next";

import type { LoginDeviceCardProps } from "@/types/devices/components";
import { DeviceIllustration } from "./DeviceIllustration";

const metaClass = "mt-[5px] flex flex-wrap gap-x-3 text-[12px] leading-[1.6] text-muted-foreground";
const metaValueClass = "text-foreground opacity-80";
export function CurrentDeviceCard({ device, onSelect, onRename }: LoginDeviceCardProps) {
  const { t } = useTranslation();
  return (
    <section
      className="mt-[7px] flex items-center gap-[22px] rounded-[16px] border border-border bg-card/70 px-6 py-5 @max-[640px]:flex-wrap @max-[640px]:gap-3.5 @max-[640px]:p-4 @max-[640px]:[&>button]:ml-[89px]"
      aria-label={device.name}
      aria-live="polite"
    >
      <div className="flex-[0_0_105px] @max-[640px]:basis-[75px]">
        <DeviceIllustration kind={device.kind} tone={device.tone} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex flex-wrap items-center gap-3">
          <h2 className="leading-1.4 text-[20px] font-[650] -tracking-wide wrap-anywhere">
            {device.name}
          </h2>
          {device.current && (
            <span className="rounded-full border border-primary/20 bg-primary/12 px-2.5 py-1 text-[11px] whitespace-nowrap text-primary">
              {t("devices.current")}
            </span>
          )}
        </div>
        <p className={metaClass}>
          {t("devices.lastActive")}
          <span className={metaValueClass}>
            {device.activity} · {device.region}
          </span>
        </p>
        <p className={metaClass}>
          {t("devices.platform")}
          <span className={metaValueClass}>{device.platform}</span>
        </p>
        <button
          type="button"
          onClick={() => onSelect(device)}
          className="mt-1.5 cursor-pointer text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {t("devices.viewDetails")}
        </button>
      </div>
      <div className="leading-1.8 flex-[0_1_230px] border-l border-border pl-6 text-[12px] text-muted-foreground @max-[900px]:hidden">
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
