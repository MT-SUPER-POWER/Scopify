"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { qqAccountQueryOptions } from "@/hooks/auth/useQqAccount";
import { cancelQqQr, checkQqQr, createQqQr, getQqQrKey } from "@/lib/providers/qq/api/login";
import { qqSessionTokenFromCookie, saveQqSessionToken } from "@/lib/providers/qq/session";
import { requestProviderSwitch } from "@/lib/providers/switchProvider";
import { runtime } from "@/lib/runtime";
import type { QrStatus } from "@/types/auth/login";
import type { QqQrLoginOptions } from "@/types/auth/qqLogin";

/** Pause between scan checks; `/login/qr/check` may also hold each request for a moment. */
const QQ_QR_POLL_INTERVAL_MS = 2000;

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * QQ Music QR login, following the NetEase QR flow: create a key and QR for the chosen app,
 * poll until it is scanned and confirmed, store the QQ session, confirm the account, then make
 * QQ the active platform. A key left behind (refresh, channel change, leaving the page) is
 * cancelled on the backend.
 */
export function useQqQrLogin({ channel, onSuccess }: QqQrLoginOptions) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const [qrImg, setQrImg] = useState("");
  const [qrStatus, setQrStatus] = useState<QrStatus>("loading");
  const [qrStatusText, setQrStatusText] = useState<string>(t("login.qr.loading"));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let key: string | null = null;
    let confirmed = false;

    const show = (status: QrStatus, text: string) => {
      if (signal.aborted) return;
      setQrStatus(status);
      setQrStatusText(text);
    };

    const run = async () => {
      setQrImg("");
      show("loading", t("login.qr.loading"));

      key = (await getQqQrKey(channel, signal)).data.unikey;
      const qr = await createQqQr(key, signal);
      if (signal.aborted) return;
      setQrImg(qr.data.qrimg);
      show("waiting", t("login.qr.waiting"));

      while (!signal.aborted) {
        const result = await checkQqQr(key, signal);
        if (signal.aborted) return;

        if (result.code === 800) {
          show("expired", t("login.qr.expired"));
          return;
        }
        if (result.code === 802) show("scanned", t("login.qr.scanned"));
        if (result.code === 801) show("waiting", t("login.qr.waiting"));
        if (result.code === 803) {
          confirmed = true;
          const token = qqSessionTokenFromCookie(result.cookie);
          if (!token) throw new Error("QQ Music login returned no session");
          saveQqSessionToken(token);
          // Confirms the account and seeds the profile; a rejected session is cleared there.
          await queryClient.fetchQuery(qqAccountQueryOptions);
          if (signal.aborted) return;
          show("success", t("login.qr.success"));
          toast.success(t("login.qr.toast.success"));
          requestProviderSwitch("qq");
          if (!runtime.auth.completeLogin()) onSuccessRef.current?.();
          return;
        }
        await wait(QQ_QR_POLL_INTERVAL_MS, signal);
      }
    };

    run().catch(() => {
      if (signal.aborted) return;
      show("expired", confirmed ? t("login.qq.loginFailed") : t("login.qr.networkError"));
    });

    return () => {
      controller.abort();
      if (key && !confirmed) void cancelQqQr(key).catch(() => undefined);
    };
  }, [channel, queryClient, refreshKey, t]);

  return { qrImg, qrStatus, qrStatusText, refresh: () => setRefreshKey((value) => value + 1) };
}
