"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { checkQR, createQR, getQRKey } from "@/lib/api/login";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { createFreshLoginDevice } from "@/lib/devices/clientIdentity";
import { completeFreshLogin } from "@/lib/devices/completeLogin";
import { useI18n } from "@/store/module/i18n";
import type { QrLoginProps, QrStatus } from "@/types/login";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export function useQrLogin({ onSuccess, deviceName }: QrLoginProps) {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();

  // ref 避免 smartRouter 每次渲染新引用导致 useEffect 反复执行
  const routerRef = useRef(smartRouter);
  routerRef.current = smartRouter;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const deviceNameRef = useRef(deviceName);
  deviceNameRef.current = deviceName;

  const [qrImg, setQrImg] = useState("");
  const [qrStatus, setQrStatus] = useState<QrStatus>("loading");
  const [qrStatusText, setQrStatusText] = useState(t("login.qr.loading"));

  // 强制刷新触发器，用于用户手动点击刷新
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // 标志位：组件是否存活 / 当前流程是否有效
    let isActive = true;

    const startLoginFlow = async () => {
      try {
        setQrImg("");
        setQrStatus("loading");
        setQrStatusText(t("login.qr.loading"));

        const device = await createFreshLoginDevice(deviceNameRef.current ?? "");
        const loginParams = { cookie: device.cookie, noLogin: true };
        // Keep the same identity throughout this QR attempt.
        const keyRes = await getQRKey(loginParams);
        const unikey = keyRes.data?.data?.unikey;
        if (!unikey || !isActive) return;

        // 2. 生成二维码
        const qrRes = await createQR(unikey, loginParams);
        if (!isActive) return;

        setQrImg(qrRes.data.data.qrimg);
        setQrStatus("waiting");
        setQrStatusText(t("login.qr.waiting"));

        // 3. 开启同步风格的轮询 (代替 setInterval)
        while (isActive) {
          const statusRes = await checkQR(unikey, loginParams);
          if (!isActive) break; // 如果请求期间组件卸载或刷新，立刻跳出

          const code = statusRes.data.code;

          if (code === 800) {
            setQrStatus("expired");
            setQrStatusText(t("login.qr.expired"));
            break; // 状态终结，跳出循环
          } else if (code === 801) {
            setQrStatus("waiting");
            setQrStatusText(t("login.qr.waiting"));
          } else if (code === 802) {
            setQrStatus("scanned");
            setQrStatusText(t("login.qr.scanned"));
          } else if (code === 803) {
            setQrStatus("success");
            setQrStatusText(t("login.qr.success"));

            const result = await completeFreshLogin(statusRes.data.cookie ?? "", "qr", {
              ...device,
              name: deviceNameRef.current?.trim() || device.name,
            });
            if (!result.nameSynced) toast.warning(t("devices.syncFailed"));
            toast.success(t("login.qr.toast.success"));

            // 通知主线程登录成功
            if (!runtime.auth.completeLogin()) {
              if (onSuccessRef.current) onSuccessRef.current();
              else routerRef.current.replace("/");
            }
            break;
          }

          // 核心：当前请求处理完后，死等 3 秒再进入下一次循环
          await delay(3000);
        }
      } catch {
        if (isActive) {
          setQrStatus("expired");
          setQrStatusText(t("login.qr.networkError"));
        }
      }
    };

    void startLoginFlow();

    return () => {
      // 清理函数：只要重新渲染或组件销毁，立刻把 isActive 置为 false
      // 这会截断任何正在进行中的 while 循环和异步请求后的赋值
      isActive = false;
    };
  }, [refreshKey, t]); // 通过 ref 获取最新 router 和 onSuccess，避免对象引用变化导致循环重渲染

  return { qrImg, qrStatus, qrStatusText, refresh: () => setRefreshKey((key) => key + 1) };
}
