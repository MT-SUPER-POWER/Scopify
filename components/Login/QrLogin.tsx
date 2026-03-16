"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { checkQR, createQR, getQRKey } from '@/lib/api/login';
import { useUserStore } from '@/store';
import { getUserAccount } from '@/lib/api/user';
import { useIsElectron } from '@/lib/hooks/useElectronDetect';
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { toast } from 'sonner';

export type QrStatus = 'loading' | 'waiting' | 'scanned' | 'expired' | 'success';

// 封装一个 Promise 版的 delay 函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function QrLogin() {
  const smartRouter = useSmartRouter();
  const isElectron = useIsElectron();

  const [qrImg, setQrImg] = useState('');
  const [qrStatus, setQrStatus] = useState<QrStatus>('loading');
  const [qrStatusText, setQrStatusText] = useState('正在加载二维码...');

  // 强制刷新触发器，用于用户手动点击刷新
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // 标志位：组件是否存活 / 当前流程是否有效
    let isActive = true;

    const startLoginFlow = async () => {
      try {
        setQrImg('');
        setQrStatus('loading');
        setQrStatusText('正在加载二维码...');

        // 1. 获取 Key
        const keyRes = await getQRKey({ ua: 'pc' });
        const unikey = keyRes.data?.data?.unikey;
        if (!unikey || !isActive) return;

        // 2. 生成二维码
        const qrRes = await createQR(unikey, { ua: 'pc' });
        if (!isActive) return;

        setQrImg(qrRes.data?.data?.qrimg);
        setQrStatus('waiting');
        setQrStatusText('打开 App 扫一扫登录');

        // 3. 开启同步风格的轮询 (代替 setInterval)
        while (isActive) {
          const statusRes = await checkQR(unikey, { ua: 'pc' });
          if (!isActive) break; // 如果请求期间组件卸载或刷新，立刻跳出

          const code = statusRes.data?.code;

          if (code === 800) {
            setQrStatus('expired');
            setQrStatusText('二维码已过期');
            break; // 状态终结，跳出循环
          } else if (code === 801) {
            setQrStatus('waiting');
            setQrStatusText('打开 App 扫一扫登录');
          } else if (code === 802) {
            setQrStatus('scanned');
            setQrStatusText('已扫码，请在手机上确认');
          } else if (code === 803) {
            setQrStatus('success');
            setQrStatusText('授权登录成功！');

            // 处理登录成功逻辑
            const rawCookie = statusRes.data?.cookie || '';
            // NOTE: 优化 cookie 存储：提取 MUSIC_U 片段，减小体积并符合网易云 API 规范
            const musicUMatch = rawCookie.match(/MUSIC_U=[^;]+/);
            const cookie = musicUMatch ? musicUMatch[0] : rawCookie;

            useUserStore.getState().setCookie(cookie);
            localStorage.setItem('cookie', cookie);

            const loginRes = await getUserAccount();
            // DEBUG: QR 登录接口返回的数据，帮助排查登录状态异常问题
            console.log('[二维码登录] getUserAccount 返回:', loginRes.data);

            if (loginRes.data?.code !== 200) {
              setQrStatus('expired');
              setQrStatusText('登录状态异常');
              toast.error("登录状态异常，请重新登录");
              break;
            }

            useUserStore.getState().setUser(loginRes.data.profile);
            useUserStore.getState().setLoginType('qr');
            toast.success("登录成功");


            if (isElectron) {
              // DEBUG: Electron 环境确认
              console.log('[二维码登录] 运行在 Electron 环境，正在尝试关闭登录窗口并刷新主窗口');

              window.electronAPI?.closeLoginWindow();
              smartRouter.replace('/');
              window.electronAPI?.maniWindowReload();
            } else {
              smartRouter.replace('/');
            }
            break; // 登录成功，跳出循环
          }

          // 核心：当前请求处理完后，死等 3 秒再进入下一次循环
          await delay(3000);
        }
      } catch (error) {
        if (isActive) {
          console.error('二维码流程异常', error);
          setQrStatus('expired');
          setQrStatusText('网络请求失败');
        }
      }
    };

    startLoginFlow();

    // 清理函数：只要重新渲染或组件销毁，立刻把 isActive 置为 false
    // 这会截断任何正在进行中的 while 循环和异步请求后的赋值
    return () => {
      isActive = false;
    };
  }, [refreshKey]); // 只有 refreshKey 改变时才重新执行整个流程

  return (
    <div className="flex flex-col items-center justify-center space-y-4 pt-2">
      <div className="relative p-3 bg-white rounded-xl shadow-lg transition-transform hover:scale-105">
        {qrImg ? (
          <img src={qrImg} alt="登录二维码" className="w-40 h-40 block" />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center text-zinc-400 text-sm animate-pulse">
            正在生成...
          </div>
        )}
        {qrStatus === 'expired' && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center cursor-pointer"
            onClick={() => setRefreshKey(k => k + 1)} // 每次点击改变 key，触发 useEffect 重新执行
          >
            <Button variant="secondary" size="sm" className="rounded-full font-bold text-xs gap-1.5">
              <RefreshCw className="w-3 h-3" /> 刷新二维码
            </Button>
          </div>
        )}
        {qrStatus === 'scanned' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
            <p className="text-white font-bold text-sm">请在手机上确认</p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className={`font-bold text-sm ${qrStatus === 'success' ? 'text-[#1db954]' : qrStatus === 'expired' ? 'text-red-400' : 'text-zinc-100'}`}>
          {qrStatusText}
        </p>
        <div className="text-zinc-500 text-xs flex items-center gap-1">
          使用 网易云音乐 APP 扫码
        </div>
      </div>
    </div>
  );
}
