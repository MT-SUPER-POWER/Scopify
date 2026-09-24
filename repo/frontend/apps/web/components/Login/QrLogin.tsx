"use client";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useQrLogin } from "@/hooks/auth/useQrLogin";
import { useI18n } from "@/store/module/i18n";
import type { QrLoginProps } from "@/types/login";
export function QrLogin(props: QrLoginProps) {
  const { t } = useI18n();
  const { qrImg, qrStatus, qrStatusText, refresh } = useQrLogin(props);
  return (
    <div className="flex flex-col items-center justify-center space-y-4 pt-2">
      <div className="relative rounded-xl bg-qr-surface p-3 shadow-panel transition-transform hover:scale-105">
        {qrImg ? (
          <Image
            src={qrImg}
            alt={t("login.qr.alt")}
            className="block size-40"
            width={160}
            height={160}
          />
        ) : (
          <div className="flex size-40 animate-pulse items-center justify-center text-sm text-calendar-ink">
            {t("login.qr.generating")}
          </div>
        )}
        {qrStatus === "expired" && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-overlay backdrop-blur-[2px]"
            onClick={refresh} // 每次点击改变 key，触发 useEffect 重新执行
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
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-media-overlay backdrop-blur-[1px]">
            <p className="text-sm font-bold text-overlay-foreground">
              {t("login.qr.confirmOnPhone")}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p
          className={`text-sm font-bold ${qrStatus === "success" ? "text-brand" : qrStatus === "expired" ? "text-danger" : "text-content"}`}
        >
          {qrStatusText}
        </p>
        <div className="flex items-center gap-1 text-xs text-content-subtle">
          {t("login.qr.scanHint")}
        </div>
      </div>
    </div>
  );
}
