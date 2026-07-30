"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkQR, createQR, getQRKey } from "@/lib/api/login";
import { getUserAccount, getUserDetail } from "@/lib/api/user";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { getBackendBaseUrl } from "@/lib/web/request";
import { logger } from "@/lib/web/logger";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
// import { saveMusicCookie } from '@/app/actions/cookie';

export type QrStatus = "loading" | "waiting" | "scanned" | "expired" | "success";

interface QrLoginProps {
  onSuccess?: () => void;
}

// 封装一个 Promise 版的 delay 函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function QrLogin({ onSuccess }: QrLoginProps) {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();

  // ref 避免 smartRouter 每次渲染新引用导致 useEffect 反复执行
  const routerRef = useRef(smartRouter);
  routerRef.current = smartRouter;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

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

        // 1. 获取 Key
        const keyRes = await getQRKey();
        const unikey = keyRes.data?.data?.unikey;
        if (!unikey || !isActive) return;

        // 2. 生成二维码
        const qrRes = await createQR(unikey);
        if (!isActive) return;

        setQrImg(qrRes.data.data.qrimg);
        setQrStatus("waiting");
        setQrStatusText(t("login.qr.waiting"));

        // 3. 开启同步风格的轮询 (代替 setInterval)
        while (isActive) {
          const statusRes = await checkQR(unikey);
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

            // NOTE: 登录时 cookie 存储的位置
            const rawCookie = statusRes.data.cookie ?? "";
            localStorage.setItem("music_cookie", rawCookie); // 先存一份到 localStorage，兜底用

            // 1. 调用主进程注入 Cookie (Electron 环境)
            await runtime.auth.persistMusicCookie(rawCookie, getBackendBaseUrl());

            // 强制带上 cookie 发起用户信息请求
            const loginRes = await getUserAccount();

            if (loginRes.data.code !== 200) {
              setQrStatus("expired");
              setQrStatusText(t("login.qr.statusError"));
              toast.error(t("login.qr.toast.statusError"));
              break;
            }

            // 接口返回的 profile 数据不是很稳定，为了解决这个问题，我们走 id 再请求后续的数据
            const userId = loginRes.data.account?.id ?? loginRes.data.profile?.userId;
            if (!userId) {
              setQrStatus("expired");
              setQrStatusText(t("login.qr.statusError"));
              toast.error(t("login.qr.toast.statusError"));
              break;
            }
            useUserStore.getState().setUserId(userId); // 兜底的
            localStorage.setItem("user_id", String(userId)); // 存储 userId 到 localStorage 保底

            const detailRes = await getUserDetail(userId);
            useUserStore.getState().setUser(detailRes.data.profile);

            useUserStore.getState().setLoginType("qr");
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
      } catch (error) {
        if (isActive) {
          logger.error("二维码流程异常", error);
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

  return (
    <div className="flex flex-col items-center justify-center space-y-4 pt-2">
      <div className="relative rounded-xl bg-white p-3 shadow-lg transition-transform hover:scale-105">
        {qrImg ? (
          <Image
            src={qrImg}
            alt={t("login.qr.alt")}
            className="block size-40"
            width={160}
            height={160}
          />
        ) : (
          <div className="flex size-40 animate-pulse items-center justify-center text-sm text-zinc-400">
            {t("login.qr.generating")}
          </div>
        )}
        {qrStatus === "expired" && (
          <div
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl bg-black/60 backdrop-blur-[2px]"
            onClick={() => setRefreshKey((k) => k + 1)} // 每次点击改变 key，触发 useEffect 重新执行
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
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[1px]">
            <p className="text-sm font-bold text-white">{t("login.qr.confirmOnPhone")}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p
          className={`text-sm font-bold ${qrStatus === "success" ? "text-[#1db954]" : qrStatus === "expired" ? "text-red-400" : "text-zinc-100"}`}
        >
          {qrStatusText}
        </p>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          {t("login.qr.scanHint")}
        </div>
      </div>
    </div>
  );
}
