"use client";
import { useQrLogin } from "@/hooks/auth/useQrLogin";
import { useTranslation } from "react-i18next";

import type { QrLoginProps } from "@/types/auth/login";
import { QrCodePanel } from "./QrCodePanel";

export function QrLogin(props: QrLoginProps) {
  const { t } = useTranslation();
  const { qrImg, qrStatus, qrStatusText, refresh } = useQrLogin(props);
  return (
    <QrCodePanel
      qrImg={qrImg}
      qrStatus={qrStatus}
      qrStatusText={qrStatusText}
      scanHint={t("login.qr.scanHint")}
      onRefresh={refresh}
    />
  );
}
