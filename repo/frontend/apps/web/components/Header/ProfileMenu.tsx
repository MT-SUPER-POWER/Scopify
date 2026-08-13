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
import { UserVipBadge } from "@/components/shared/UserVipBadge";
import { useVipSign } from "@/hooks/vipSign/useVipSign";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignDetail } from "@/types/api/vipSign";

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
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
    if (!runtime.auth.openLoginWindow()) smartRouter.push("/login");
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
          className="bg-surface-overlay/95 text-content shadow-floating border-border w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border p-2 backdrop-blur-2xl transition-all"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-0.5">
            {/* 顶部用户资料卡片 */}
            {isLoggedIn && user ? (
              <DropdownMenuItem
                asChild
                className="bg-surface-elevated border-border hover:border-content/20 hover:bg-accent focus:bg-accent group mb-1.5 cursor-pointer rounded-xl border p-2.5 shadow-xs transition-all"
              >
                <Link href={`/profile?userId=${userId}`} className="flex items-center gap-3">
                  <div className="ring-brand/40 relative size-10 shrink-0 overflow-hidden rounded-full ring-2 transition-transform group-hover:scale-105">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.nickname || ""}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-brand text-brand-foreground flex size-full items-center justify-center text-sm font-bold">
                        {user.nickname?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="text-content group-hover:text-brand truncate text-sm font-bold transition-colors">
                          {user.nickname || t("profile.menu.profile")}
                        </span>
                        <UserVipBadge vipType={user.vipType} />
                      </div>
                      <ChevronRight className="text-content-muted group-hover:text-content size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-content-muted truncate text-xs">
                      {user.signature || t("profile.menu.profile")}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ) : (
              isLoggedIn && (
                <DropdownMenuItem
                  asChild
                  className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <Link href={`/profile?userId=${userId}`}>
                    <User className="text-content-muted mr-3 size-4 shrink-0" />
                    <span className="flex-1">{t("profile.menu.profile")}</span>
                  </Link>
                </DropdownMenuItem>
              )
            )}

            {/* 小屏才显示的 Bell / Friends */}
            <DropdownMenuItem
              onSelect={() =>
                smartRouter.push(
                  runtime.isDesktop ? "/setting?tab=desktop#app-updater" : "/setting",
                )
              }
              className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium md:hidden"
            >
              <Bell className="text-content-muted mr-3 size-4 shrink-0" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium md:hidden">
              <Users className="text-content-muted mr-3 size-4 shrink-0" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-1 md:hidden" />

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
              className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
            >
              <Settings className="text-content-muted mr-3 size-4 shrink-0" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {/* 下载桌面端 */}
            {!runtime.isDesktop && (
              <DropdownMenuItem
                className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
                onSelect={() => ProfileCallback("download")}
              >
                <Download className="text-content-muted mr-3 size-4 shrink-0" />
                <span>{t("profile.menu.download")}</span>
              </DropdownMenuItem>
            )}

            {/* 关于我 */}
            <DropdownMenuItem
              className="text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content cursor-pointer rounded-lg px-3 py-2 text-sm font-medium"
              onSelect={() => ProfileCallback("about")}
            >
              <Coffee className="text-content-muted mr-3 size-4 shrink-0" />
              <span>{t("profile.menu.aboutMe")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border my-1.5" />

            {/* 登录/登出 放在最后 */}
            {isLoggedIn ? (
              <DropdownMenuItem
                onSelect={handleLogoutClick}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                <LogOut className="text-destructive mr-3 size-4 shrink-0" />
                <span>{t("common.action.logout")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="text-brand hover:bg-brand/10 hover:text-brand-hover focus:bg-brand/10 focus:text-brand-hover cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                <LogIn className="text-brand mr-3 size-4 shrink-0" />
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
        />
      )}
    </>
  );
}
