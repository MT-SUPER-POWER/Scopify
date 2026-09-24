"use client";

import { LogOut, Pencil, X } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@scopify/ui/shadcn/components/sheet";
import { useI18n } from "@/store/module/i18n";
import type { LoginDeviceDetailsProps } from "@/types/components/loginDevices";
import { DeviceIllustration } from "./DeviceIllustration";
import styles from "./LoginDevices.module.css";

export function LoginDeviceDetails({ device, onClose, onAction }: LoginDeviceDetailsProps) {
  const { t, locale } = useI18n();
  return (
    <Sheet
      open={device !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" showCloseButton={false}>
        <SheetHeader className="px-7 pt-8 pr-16">
          <SheetTitle>{t("devices.details")}</SheetTitle>
          <SheetDescription>{t("devices.detailsHint")}</SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-5 right-5"
            aria-label={t("devices.close")}
          >
            <X />
          </Button>
        </SheetClose>
        {device && (
          <div className="flex flex-1 flex-col px-7 pb-8">
            <div className={styles.detailStage}>
              <DeviceIllustration kind={device.kind} tone={device.tone} />
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{device.name}</h2>
            {device.current && <p className="mt-2 text-sm text-brand">{t("devices.current")}</p>}
            <dl className={styles.detailList}>
              <div>
                <dt>{t("devices.platform")}</dt>
                <dd>{device.platform}</dd>
              </div>
              <div>
                <dt>{t("devices.lastActive")}</dt>
                <dd>
                  {device.lastActiveTime
                    ? new Date(device.lastActiveTime).toLocaleString(locale)
                    : t("devices.unknown")}
                </dd>
              </div>
              <div>
                <dt>{t("devices.region")}</dt>
                <dd>{device.region}</dd>
              </div>
              <div>
                <dt>{t("devices.loginMethod")}</dt>
                <dd>{device.loginMethod}</dd>
              </div>
            </dl>
            <div className="mt-auto pt-10">
              {device.current && (
                <Button
                  variant="outline"
                  className="mb-3 w-full rounded-xl"
                  onClick={() => onAction({ type: "rename", device })}
                >
                  <Pencil className="size-4" />
                  {t("devices.rename")}
                </Button>
              )}
              <Button
                variant="outline"
                disabled={!device.deviceKey}
                onClick={() => onAction({ type: "kickoff", device })}
                className="w-full rounded-xl text-destructive"
              >
                <LogOut className="size-4" />
                {t("devices.signOut")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
