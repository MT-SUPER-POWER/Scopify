"use client";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useTranslation } from "react-i18next";

import type { QrCodePanelProps } from "@/types/auth/qqLogin";

/** The QR image with its expired / scanned overlays and status line, shared by both platforms. */
export function QrCodePanel({
  qrImg,
  qrStatus,
  qrStatusText,
  scanHint,
  onRefresh,
}: QrCodePanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-2xl bg-qr-surface p-3 shadow-panel">
        {qrImg ? (
          <Image
            src={qrImg}
            alt={t("login.qr.alt")}
            className="block size-48"
            width={192}
            height={192}
          />
        ) : (
          <div className="flex size-48 animate-pulse items-center justify-center text-sm text-calendar-ink">
            {t("login.qr.generating")}
          </div>
        )}
        {qrStatus === "expired" && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-overlay backdrop-blur-[2px]"
            onClick={onRefresh}
          >
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-full text-xs font-bold"
            >
              <RefreshCw className="size-3" /> {t("login.qr.refresh")}
            </Button>
          </div>
        )}
        {qrStatus === "scanned" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-media-overlay backdrop-blur-[1px]">
            <p className="text-sm font-bold text-overlay-foreground">
              {t("login.qr.confirmOnPhone")}
            </p>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-col items-center gap-1.5">
        <p
          className={`text-sm font-bold ${qrStatus === "success" ? "text-brand" : qrStatus === "expired" ? "text-danger" : "text-content"}`}
        >
          {qrStatusText}
        </p>
        <div className="flex items-center gap-1 text-xs text-content-subtle">{scanHint}</div>
      </div>
    </div>
  );
}
