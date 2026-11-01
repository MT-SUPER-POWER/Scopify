"use client";

import { ArrowUpRight } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useTranslation } from "react-i18next";

import type { LoginDeviceCardProps } from "@/types/devices/components";
import { DeviceIllustration } from "./DeviceIllustration";

export function LoginDeviceCard({ device, onSelect }: LoginDeviceCardProps) {
  const { t } = useTranslation();
  return (
    <li className="flex min-h-[85px] items-center gap-5 border-border px-2 py-2.5 not-first:border-t max-[700px]:gap-3 max-[700px]:px-0">
      <div className="flex h-[58px] flex-[0_0_58px] items-center">
        <DeviceIllustration kind={device.kind} tone={device.tone} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold wrap-anywhere">{device.name}</h3>
        <p className="mt-1.5 flex flex-wrap gap-1.5 text-[12px] leading-normal text-muted-foreground">
          {device.activity}
          <span>·</span>
          {device.region}
          <span className="ml-[22px] @max-[640px]:ml-0">{device.platform}</span>
        </p>
      </div>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => onSelect(device)}
        aria-label={`${device.name} · ${t("devices.viewDetails")}`}
      >
        <span className="max-[700px]:hidden">{t("devices.viewDetails")}</span>
        <ArrowUpRight className="size-3.5" />
      </Button>
    </li>
  );
}
