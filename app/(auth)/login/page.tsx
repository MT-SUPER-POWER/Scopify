"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


import React, { Suspense, useState, useEffect } from 'react';
import { Smartphone, Lock, QrCode, X } from 'lucide-react';
import { loginByCellphone } from '@/lib/api/login';
import { sendCaptcha } from '@/lib/web/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useIsElectron } from '@/lib/hooks/useElectronDetect';
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { toast } from 'sonner';
import { useLoginStatus } from '@/lib/hooks/useLoginStatus';
import LoginSkeletonLoading from './loading';
import { PasswordLoginForm } from '@/components/Login/PasswordLoginForm';
import { SmsLoginForm } from '@/components/Login/SmsLoginForm';
import { QrLogin } from '@/components/Login/QrLogin';

type LoginMode = 'password' | 'sms' | 'qr';

let hydrationReady = false;
let hydrationPromise: Promise<void> | null = null;

function HydrationGate({ children }: { children: React.ReactNode }) {
  if (!hydrationReady && typeof window !== 'undefined') {
    if (!hydrationPromise) {
      hydrationPromise = new Promise((resolve) => {
        requestAnimationFrame(() => {
          hydrationReady = true;
          resolve();
        });
      });
    }
    throw hydrationPromise;
  }

  return <>{children}</>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LoginPageContent() {
  const smartRouter = useSmartRouter();
  const [mode, setMode] = useState<LoginMode>('qr');
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = useLoginStatus();
  const isElectron = useIsElectron();

  // 1. 处理密码或验证码提交
  const handleSubmit = async (phone: string, extra: string) => {
    setIsLoading(true);
    try {
      let res;
      if (mode === 'password') {
        res = await loginByCellphone({ phone, password: extra });
      } else if (mode === 'sms') {
        res = await loginByCellphone({ phone, captcha: extra });
      }

      console.log('登录响应', res);
      // 这里可以补充登录成功后的逻辑，设置 userStore 等
    } catch (error) {
      console.error(error);
      toast.error("登录失败，请检查账号密码");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 发送验证码逻辑
  const handleSendCaptcha = async (phone: string) => {
    try {
      await sendCaptcha(phone);
      return true;
    } catch (error) {
      console.error('发送验证码失败', error);
      toast.error("发送验证码失败");
      return false;
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      smartRouter.replace('/');
    }
  }, [isLoggedIn, smartRouter]);

  if (isLoggedIn) {
    return <LoginSkeletonLoading />;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center bg-black text-white p-4 min-h-screen w-screen overflow-hidden",
    )}>

      {/* 右上角退出按钮，点击返回主页 */}
      {isElectron ? null : (
        <button className='absolute top-5 right-6 p-1 rounded-full hover:bg-white/10 transition-colors' title="返回主页">
          <Link href="/" className="flex items-center justify-center">
            <X className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />
          </Link>
        </button>
      )}

      {/* 1. Logo 区域优化 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 text-black font-black text-3xl shadow-2xl">
          S
        </div>
        <p className="text-zinc-500 text-xs font-medium">发现属于你的旋律</p>
      </div>

      {/* 2. 主体宽度 */}
      <div className="w-full max-w-[320px]">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">

          {/* 3. Tab 切换器 */}
          <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900/60 border border-white/5 rounded-xl h-10 p-1">
            <TabsTrigger value="qr" title="扫码" className="text-xs data-[state=active]:bg-zinc-800 rounded-lg">
              <QrCode className="w-3.5 h-3.5 mr-1" />
              扫码
            </TabsTrigger>
            <TabsTrigger value="password" title="密码" className="text-xs data-[state=active]:bg-zinc-800 rounded-lg">
              <Lock className="w-3.5 h-3.5 mr-1" />
              密码
            </TabsTrigger>
            <TabsTrigger value="sms" title="短信" className="text-xs data-[state=active]:bg-zinc-800 rounded-lg">
              <Smartphone className="w-3.5 h-3.5 mr-1" />
              短信
            </TabsTrigger>
          </TabsList>

          {/* 4. 表单容器 */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
            <TabsContent value="password" className="mt-0 outline-none">
              <PasswordLoginForm
                isLoading={isLoading}
                onSubmit={(phone, password) => handleSubmit(phone, password)}
              />
            </TabsContent>

            <TabsContent value="sms" className="mt-0 outline-none">
              <SmsLoginForm
                isLoading={isLoading}
                onSendCaptcha={handleSendCaptcha}
                onSubmit={(phone, captcha) => handleSubmit(phone, captcha)}
              />
            </TabsContent>

            <TabsContent value="qr" className="mt-0 outline-none">
              <QrLogin />
            </TabsContent>
          </div>
        </Tabs>

        {/* 底部文案 */}
        <p className="mt-6 text-center text-[12px] text-zinc-600 font-medium">
          只有扫码登录能用，其他登录被网易封死了
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeletonLoading />}>
      <HydrationGate>
        <LoginPageContent />
      </HydrationGate>
    </Suspense>
  );
}
