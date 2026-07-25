// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Coffee,
  Download,
  LogIn,
  LogOut,
  Settings,
  User,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VipSignMenuCard } from "@/components/VipSign/VipSignMenuCard";
import { VipSignModal } from "@/components/VipSign/VipSignModal";
import { useVipSign } from "@/hooks/vipSign/useVipSign";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignDetail } from "@/types/api/vipSign";

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  const isElectron = IS_ELECTRON;
  const smartRouter = useSmartRouter();
  const user = useUserStore((state) => state.user);
  const userId = user?.userId;
  const isLoggedIn = useLoginStatus();

  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [modalTodayRecord, setModalTodayRecord] = useState<VipSignDetail | undefined>(undefined);

  const {
    hasSignedToday,
    isLoading: isSignLoading,
    doSign,
    fetchSignDetail,
    isSigning,
    fetchTodayRecord,
    signHistory,
  } = useVipSign();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 未签到执行 POST /vip/sign，已签到则 GET /vip/sign/detail 查看详情。
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleVipSign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSignLoading || isSigning) return;
    setProfileMenuOpen(false);

    let record: VipSignDetail | undefined;

    if (hasSignedToday) {
      // 已签到 → 读取当天详情，不再重复触发签到
      record = await fetchTodayRecord();
    } else {
      // 未签到 → 执行签到，从返回值里拿 checkinDetail.data
      const result = await doSign();
      record = result.checkinDetail?.data;
      // 兜底：如果签到返回里没有 checkinDetail，再单独请求一次
      if (!record) {
        record = await fetchTodayRecord();
      }
    }

    setModalTodayRecord(record);
    setSignModalOpen(true);
  };

  const handleSelectVipSignDay = async (signTime: number) => {
    setProfileMenuOpen(false);
    const record = await fetchSignDetail(signTime);
    if (!record) return;

    setModalTodayRecord(record);
    setSignModalOpen(true);
  };

  const handleLoginClick = () => {
    if (typeof window !== "undefined" && isElectron) {
      window.electronAPI?.openLoginWindow();
    } else {
      smartRouter.push("/login");
    }
  };

  const handleLogoutClick = () => {
    useUserStore.getState().handleLogout();
    usePlayerStore.getState().cleanCache();
    smartRouter.replace("/");
  };

  const ProfileCallback = (id: "download" | "about") => {
    switch (id) {
      case "download":
        window.location.replace("https://github.com/MT-SUPER-POWER/Scopify/releases");
        break;
      case "about":
        smartRouter.push("/me");
        break;
      default:
        console.log(`Selected ${id} -- 功能待开发`);
    }
  };

  return (
    <>
      <DropdownMenu open={isProfileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="cursor-pointer focus:ring-0 focus:outline-hidden">
            {children}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#16161a]/95 p-2 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-0.5">
            {/* 顶部用户资料卡片 */}
            {isLoggedIn && user ? (
              <DropdownMenuItem
                asChild
                className="group mb-1.5 cursor-pointer rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2.5 shadow-xs transition-all hover:border-white/20 hover:bg-white/[0.06] focus:bg-white/[0.08]"
              >
                <Link href={`/profile?userId=${userId}`} className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-emerald-500/40 transition-transform group-hover:scale-105">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.nickname || ""}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-bold text-white">
                        {user.nickname?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-bold text-white transition-colors group-hover:text-emerald-400">
                        {user.nickname || t("profile.menu.profile")}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </div>
                    <p className="truncate text-xs text-zinc-400">
                      {user.signature || t("profile.menu.profile")}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ) : (
              isLoggedIn && (
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                >
                  <Link href={`/profile?userId=${userId}`}>
                    <User className="mr-3 size-4 shrink-0 text-zinc-400" />
                    <span className="flex-1">{t("profile.menu.profile")}</span>
                  </Link>
                </DropdownMenuItem>
              )
            )}

            {/* 小屏才显示的 Bell / Friends */}
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white md:hidden">
              <Bell className="mr-3 size-4 shrink-0 text-zinc-400" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white md:hidden">
              <Users className="mr-3 size-4 shrink-0 text-zinc-400" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-white/10 md:hidden" />

            {/* 网易乐签 */}
            {isLoggedIn && (
              <VipSignMenuCard
                actionLabel={
                  hasSignedToday ? t("profile.menu.viewMonthlySign") : t("profile.menu.signIn")
                }
                hasSignedToday={hasSignedToday}
                isLoading={isSignLoading}
                isSigning={isSigning}
                onAction={handleVipSign}
                onSelectSignDay={handleSelectVipSignDay}
                signHistory={signHistory}
              />
            )}

            {/* 设置 */}
            <DropdownMenuItem
              onSelect={() => smartRouter.push("/setting")}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
            >
              <Settings className="mr-3 size-4 shrink-0 text-zinc-400" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {/* 下载桌面端 */}
            {!IS_ELECTRON && (
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                onSelect={() => ProfileCallback("download")}
              >
                <Download className="mr-3 size-4 shrink-0 text-zinc-400" />
                <span>{t("profile.menu.download")}</span>
              </DropdownMenuItem>
            )}

            {/* 关于我 */}
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
              onSelect={() => ProfileCallback("about")}
            >
              <Coffee className="mr-3 size-4 shrink-0 text-zinc-400" />
              <span>{t("profile.menu.aboutMe")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-white/10" />

            {/* 登录/登出 放在最后 */}
            {isLoggedIn ? (
              <DropdownMenuItem
                onSelect={handleLogoutClick}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300"
              >
                <LogOut className="mr-3 size-4 shrink-0 text-rose-400" />
                <span>{t("common.action.logout")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-300"
              >
                <LogIn className="mr-3 size-4 shrink-0 text-emerald-400" />
                <span>{t("common.action.login")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {signModalOpen && (
        <VipSignModal
          open={signModalOpen}
          onClose={() => setSignModalOpen(false)}
          todayRecord={modalTodayRecord}
          signHistory={signHistory}
          onSelectSignDay={handleSelectVipSignDay}
        />
      )}
    </>
  );
}
