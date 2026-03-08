"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Smartphone, Lock, QrCode, RefreshCw, X } from 'lucide-react';
import { checkQR, createQR, getQRKey, loginByCellphone } from '@/lib/api/login';
import { sendCaptcha } from '@/lib/web/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserStore } from '@/store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useIsElectron } from '@/lib/hooks/useElectronDetect';
import { toast } from 'sonner';
import { getUserAccount } from '@/lib/api/user';
import { useLoginStatus } from '@/lib/hooks/useLoginStatus';
import LoginSkeletonLoading from './loading';

type LoginMode = 'password' | 'sms' | 'qr';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('qr');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 新增挂载状态，用于控制骨架屏
  const [isMounted, setIsMounted] = useState(false);
  const isLoggedIn = useLoginStatus();

  // --- 表单状态 ---
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');

  // --- 验证码倒计时状态 ---
  const [countdown, setCountdown] = useState(0);

  // --- 二维码状态 ---
  const [qrImg, setQrImg] = useState('');  // base64 图片
  const [qrStatus, setQrStatus] = useState<'loading' | 'waiting' | 'scanned' | 'expired' | 'success'>('loading');
  const [qrStatusText, setQrStatusText] = useState('正在加载二维码...');
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. 处理密码或验证码提交
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    try {
      let res;
      if (mode === 'password') {
        if (!password) return;
        res = await loginByCellphone({ phone, password });
      } else if (mode === 'sms') {
        if (!captcha) return;
        res = await loginByCellphone({ phone, captcha });
      }

      console.log('登录响应', res);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 发送验证码逻辑
  const handleSendCaptcha = async () => {
    if (!phone) return;
    if (countdown > 0) return;

    try {
      await sendCaptcha(phone);
      setCountdown(60);
    } catch (error) {
      console.error('发送验证码失败', error);
    }
  };

  // 处理验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 轮询二维码状态
  const pollQRStatus = useCallback((unikey: string) => {
    return setInterval(async () => {
      try {
        const statusRes = await checkQR(unikey);
        const code = statusRes.data?.code;

        if (code === 800) {
          setQrStatus('expired');
          setQrStatusText('二维码已过期');
          clearInterval(qrTimerRef.current!);
        } else if (code === 801) {
          setQrStatus('waiting');
          setQrStatusText('打开 App 扫一扫登录');
        } else if (code === 802) {
          setQrStatus('scanned');
          setQrStatusText('已扫码，请在手机上确认');
        } else if (code === 803) {

          setQrStatus('success');
          setQrStatusText('授权登录成功！');
          clearInterval(qrTimerRef.current!);

          const cookie = statusRes.data?.cookie || '';

          // 存储 cookie 到 Zustand
          useUserStore.getState().setCookie(cookie);
          // 兼容旧逻辑，也存一份到 localStorage
          localStorage.setItem('cookie', cookie);

          const loginRes = await getUserAccount();  // 校验我们拿到的 cookie 是不是有效的

          // console.log("请求的用户信息", loginRes);

          // NOTE: 这里虽然理论上不太可能出现，除非如果网易接口突然改了，导致登录状态异常，
          if (loginRes.data?.code !== 200) {
            setQrStatus('expired');
            setQrStatusText('二维码已过期');
            clearInterval(qrTimerRef.current!);
            toast.error("登录状态异常，请重新登录");
            return;
          }

          // Cookie 没用了，所以这个请求没法通过认证，即使请求能到，也没有数据的
          if (loginRes.data?.account === null || loginRes.data?.profile === null) {
            toast.error("登录状态异常，请重新登录");
            return;
          }

          useUserStore.getState().setUser(loginRes.data.profile); // 数据结构参考：apifox - /user/account
          useUserStore.getState().setLoginType('qr');

          if (useIsElectron()) {
            window.electronAPI?.closeLoginWindow();
            router.replace('/');
            window.electronAPI?.maniWindowReload();
            toast.success("登录成功");
            return;
          }
          router.replace('/');
          toast.success("登录成功");
        }
      } catch (error) {
        // toast.error("轮询二维码状态失败");
        console.error('轮询二维码状态失败', error);
      }
    }, 3000);
  }, [router]);

  // 初始化二维码
  const initQRLogin = useCallback(async () => {
    if (qrTimerRef.current) {
      clearInterval(qrTimerRef.current);
      qrTimerRef.current = null;
    }
    try {
      setQrImg('');
      setQrStatus('loading');
      setQrStatusText('正在加载二维码...');

      const keyRes = await getQRKey();
      const unikey = keyRes.data?.data?.unikey;
      if (!unikey) throw new Error("获取 Key 失败");

      const qrRes = await createQR(unikey);
      const qrimg = qrRes.data?.data?.qrimg;
      setQrImg(qrimg);
      setQrStatus('waiting');
      setQrStatusText('打开 App 扫一扫登录');

      qrTimerRef.current = pollQRStatus(unikey);
    } catch (error) {
      setQrStatus('expired');
      setQrStatusText('二维码加载失败');
      console.error('二维码初始化失败', error);
    }
  }, [pollQRStatus]);


  // 组件挂载完毕
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 只有组件挂载完成且确认未登录时，才初始化二维码，避免后台无用请求
    if (!isLoggedIn && mode === 'qr') {
      initQRLogin();
    }
    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, [mode, initQRLogin, isLoggedIn]);

  useEffect(() => {
    if (isMounted && isLoggedIn) {
      router.replace('/');
    }
  }, [isMounted, isLoggedIn, router]);

  // NOTE: 手动实现 Suspend 效果
  if (!isMounted || isLoggedIn) {
    // 渲染阶段非常纯粹：如果还没挂载完，或者正在重定向中，就老老实实地返回一段骨架屏 UI，绝对不去操作 router
    return <LoginSkeletonLoading />;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center bg-black text-white p-4 min-h-screen w-screen overflow-hidden",
    )}>

      {/* 右上角退出按钮，点击返回主页 */}
      {useIsElectron() ? null : (
        <button className='absolute top-5 right-6 p-1 rounded-full hover:bg-white/10 transition-colors' title="返回主页">
          <Link href="/" className="flex items-center justify-center">
            <X className="w-5 h-5 text-zinc-500 hover:text-white transition-colors" />
          </Link>
        </button>)}

      {/* 1. Logo 区域优化：缩小外边距和 Logo 尺寸，使其更紧凑 */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 text-black font-black text-3xl shadow-2xl">
          S
        </div>
        <p className="text-zinc-500 text-xs font-medium">发现属于你的旋律</p>
      </div>

      {/* 2. 主体宽度适当收窄，贴合小窗口比例 */}
      <div className="w-full max-w-[320px]">
        <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)} className="w-full">

          {/* 3. Tab 切换器：减小底部 margin，固定高度和内边距 */}
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

          {/* 4. 表单容器：将 p-8 改为 p-5，rounded-3xl 改为 2xl，减少内部空间浪费 */}
          <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">

            <TabsContent value="password" className="mt-0 outline-none">
              {/* 5. 内部元素间距：space-y-6 缩减为 space-y-4 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-zinc-300">手机号码</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="bg-black/50 border-white/10 h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-zinc-300">密码</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="bg-black/50 border-white/10 h-10 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold h-10 rounded-full transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2"
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sms" className="mt-0 outline-none">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone-sms" className="text-xs text-zinc-300">手机号码</Label>
                  <Input
                    id="phone-sms"
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="bg-black/50 border-white/10 h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="captcha" className="text-xs text-zinc-300">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="captcha"
                      type="text"
                      value={captcha}
                      onChange={e => setCaptcha(e.target.value)}
                      placeholder="4 位验证码"
                      className="bg-black/50 border-white/10 h-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendCaptcha}
                      disabled={countdown > 0}
                      className="shrink-0 border-white/10 text-white hover:bg-white/5 font-bold h-10 px-3 rounded-md transition-colors text-xs disabled:opacity-50"
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold h-10 rounded-full transition-all hover:scale-[1.02] active:scale-95 mt-2"
                >
                  {isLoading ? '验证中...' : '验证并登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="qr" className="mt-0 outline-none">
              <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                <div className="relative p-3 bg-white rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-transform hover:scale-105">
                  {/* 使用 base64 img 直接渲染二维码 */}
                  {qrImg ? (
                    <img src={qrImg} alt="登录二维码" className="w-40 h-40 block" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-zinc-400 text-sm animate-pulse">
                      正在生成...
                    </div>
                  )}
                  {/* 二维码过期遮罩 */}
                  {qrStatus === 'expired' && (
                    <div
                      className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center cursor-pointer"
                      onClick={initQRLogin}
                    >
                      <Button variant="secondary" size="sm" className="rounded-full font-bold text-xs gap-1.5">
                        <RefreshCw className="w-3 h-3" />
                        刷新二维码
                      </Button>
                    </div>
                  )}
                  {/* 已扫码半透明提示 */}
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
                  <p className="text-zinc-500 text-xs">使用网易云音乐 APP 扫码</p>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>

        {/* 底部文案减小 mt，避免挤压导致滚动条 */}
        <p className="mt-6 text-center text-[12px] text-zinc-600 font-medium">
          目前只有 QR 登录是正常的，其他登录别被网易封死了
        </p>
      </div>
    </div>
  );
}
