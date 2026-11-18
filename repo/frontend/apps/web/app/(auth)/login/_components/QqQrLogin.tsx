"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQqQrLogin } from "@/hooks/auth/useQqQrLogin";
import type { TranslationKey } from "@/lib/i18n";

import type { QqQrLoginProps } from "@/types/auth/qqLogin";
import type { QqLoginChannel } from "@/types/providers/qq/loginApi";
import { QrCodePanel } from "./QrCodePanel";
import {
  LOGIN_BODY_CLASS_NAME,
  LOGIN_TAB_TRIGGER_CLASS_NAME,
  LOGIN_TABS_LIST_CLASS_NAME,
} from "./loginStyles";

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

/** QQ Music only signs in by QR; its method tabs choose which app scans it. */
export function QqQrLogin({ onSuccess }: QqQrLoginProps) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<QqLoginChannel>("qq");
  const { qrImg, qrStatus, qrStatusText, refresh } = useQqQrLogin({ channel, onSuccess });
  const hintKey =
    QQ_LOGIN_CHANNELS.find((item) => item.channel === channel)?.hintKey ?? "login.qq.scanHint.qq";

  return (
    <Tabs
      value={channel}
      onValueChange={(value) => {
        if (isQqLoginChannel(value)) setChannel(value);
      }}
      className="w-full"
    >
      <TabsList className={`${LOGIN_TABS_LIST_CLASS_NAME} grid-cols-3`}>
        {QQ_LOGIN_CHANNELS.map((item) => (
          <TabsTrigger
            key={item.channel}
            value={item.channel}
            disabled={qrStatus === "success"}
            className={LOGIN_TAB_TRIGGER_CLASS_NAME}
          >
            {t(item.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className={LOGIN_BODY_CLASS_NAME}>
        <QrCodePanel
          qrImg={qrImg}
          qrStatus={qrStatus}
          qrStatusText={qrStatusText}
          scanHint={t(hintKey)}
          onRefresh={refresh}
        />
      </div>
    </Tabs>
  );
}
