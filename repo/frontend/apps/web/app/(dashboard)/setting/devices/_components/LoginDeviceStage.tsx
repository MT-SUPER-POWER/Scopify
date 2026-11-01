"use client";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { LoginDeviceStageProps } from "@/types/devices/components";
import { DeviceIllustration } from "./DeviceIllustration";

// 演播室背景只铺到标签上方；设备少于 4 台时改为居中的定宽列
const stageClass =
  "grid min-w-[650px] grid-cols-[34%_17%_29%_20%] bg-[url(/images/devices/studio.png)] bg-[length:100%_calc(100%_-_46px)] bg-top bg-no-repeat px-[34px] pt-[22px] pb-5 max-[700px]:px-[18px] data-[count=1]:grid-cols-[minmax(0,380px)] data-[count=1]:justify-center data-[count=2]:grid-cols-[repeat(2,minmax(0,350px))] data-[count=2]:justify-center data-[count=3]:grid-cols-3";
// 每种设备素材的留白不同，按 data-asset 微调宽度与下沉量，让底部落在同一桌面线上
const hardwareClass = cn(
  "flex h-[clamp(200px,26cqi,310px)] items-end justify-center",
  "[&>[data-asset]]:transition-[transform] [&>[data-asset]]:duration-250 [&>[data-asset]]:ease-[ease] motion-reduce:[&>[data-asset]]:transition-none",
  "group-hover/device:[&>[data-asset]]:brightness-110",
  "[&>[data-asset=monitor]]:w-[96%] [&>[data-asset=monitor]]:translate-y-[10%]",
  "[&>[data-asset=phone]]:w-full [&>[data-asset=phone]]:max-w-[205px] [&>[data-asset=phone]]:translate-y-[2%]",
  "[&>[data-asset=laptop]]:w-[90%] [&>[data-asset=laptop]]:translate-y-[15%]",
  "[&>[data-asset=tower]]:w-[90%] [&>[data-asset=tower]]:max-w-[215px] [&>[data-asset=tower]]:translate-y-[6%]",
);
const labelClass =
  "relative flex flex-col items-center gap-1.5 px-1 pt-7 pb-1 before:absolute before:top-[13px] before:h-[3px] before:w-12 before:rounded-[9px] before:bg-transparent group-aria-pressed/device:before:bg-primary";
export function LoginDeviceStage({ devices, selectedDevice, onSelect }: LoginDeviceStageProps) {
  const { t } = useTranslation();
  return (
    <div className="-mx-[34px] overflow-x-auto max-[700px]:-mx-[18px]">
      <div
        className={stageClass}
        data-count={Math.min(devices.length, 4)}
        role="group"
        aria-label={t("devices.all")}
      >
        {devices.slice(0, 4).map((device) => (
          <button
            key={device.id}
            type="button"
            className="group/device flex min-w-0 cursor-pointer flex-col items-stretch text-center text-foreground"
            data-kind={device.kind}
            title={device.name}
            aria-pressed={selectedDevice.id === device.id}
            onClick={() => onSelect(device)}
          >
            <div className={hardwareClass}>
              <DeviceIllustration kind={device.kind} tone={device.tone} hero />
            </div>
            <span className={labelClass}>
              <strong className="max-w-full truncate text-[15px] font-semibold">
                {device.name}
              </strong>
              <span
                data-current={device.current || undefined}
                className="text-[11px] leading-normal text-muted-foreground data-current:text-primary"
              >
                {device.current ? t("devices.current") : `${device.activity} · ${device.region}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
