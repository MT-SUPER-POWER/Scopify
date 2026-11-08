"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQqQrLogin } from "@/hooks/auth/useQqQrLogin";
import type { TranslationKey } from "@/lib/i18n";

import type { QqQrLoginProps } from "@/types/auth/qqLogin";
import type { QqLoginChannel } from "@/types/providers/qq/loginApi";
import { QrCodePanel } from "./QrCodePanel";

const QQ_LOGIN_CHANNELS: readonly {
  channel: QqLoginChannel;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
}[] = [
  { channel: "qq", labelKey: "login.qq.channel.qq", hintKey: "login.qq.scanHint.qq" },
  { channel: "wechat", labelKey: "login.qq.channel.wechat", hintKey: "login.qq.scanHint.wechat" },
  {
    channel: "qqmusic",
    labelKey: "login.qq.channel.qqmusic",
    hintKey: "login.qq.scanHint.qqmusic",
  },
];

function isQqLoginChannel(value: string): value is QqLoginChannel {
  return QQ_LOGIN_CHANNELS.some((item) => item.channel === value);
}

/** QQ Music QR login; the user picks which app scans it. */
export function QqQrLogin({ onSuccess }: QqQrLoginProps) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<QqLoginChannel>("qq");
  const { qrImg, qrStatus, qrStatusText, refresh } = useQqQrLogin({ channel, onSuccess });
  const hintKey =
    QQ_LOGIN_CHANNELS.find((item) => item.channel === channel)?.hintKey ?? "login.qq.scanHint.qq";

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={channel}
        onValueChange={(value) => {
          if (isQqLoginChannel(value)) setChannel(value);
        }}
      >
        <TabsList className="grid h-8 w-full grid-cols-3 rounded-lg bg-content/5 p-0.5">
          {QQ_LOGIN_CHANNELS.map((item) => (
            <TabsTrigger
              key={item.channel}
              value={item.channel}
              disabled={qrStatus === "success"}
              className="rounded-md text-xs data-[state=active]:bg-surface-elevated"
            >
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <QrCodePanel
        qrImg={qrImg}
        qrStatus={qrStatus}
        qrStatusText={qrStatusText}
        scanHint={t(hintKey)}
        onRefresh={refresh}
      />
    </div>
  );
}
