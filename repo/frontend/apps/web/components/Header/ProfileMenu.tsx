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
          className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface-overlay/95 p-2 text-content shadow-floating backdrop-blur-2xl transition-all"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-0.5">
            {/* 顶部用户资料卡片 */}
            {isLoggedIn && user ? (
              <DropdownMenuItem
                asChild
                className="group mb-1.5 cursor-pointer rounded-xl border border-border bg-surface-elevated p-2.5 shadow-xs transition-all hover:border-content/20 hover:bg-accent focus:bg-accent"
              >
                <Link href={`/profile?userId=${userId}`} className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-brand/40 transition-transform group-hover:scale-105">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.nickname || ""}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-brand text-sm font-bold text-brand-foreground">
                        {user.nickname?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-content transition-colors group-hover:text-brand">
                          {user.nickname || t("profile.menu.profile")}
                        </span>
                        <UserVipBadge vipType={user.vipType} />
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-content-muted transition-transform group-hover:translate-x-0.5 group-hover:text-content" />
                    </div>
                    <p className="truncate text-xs text-content-muted">
                      {user.signature || t("profile.menu.profile")}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ) : (
              isLoggedIn && (
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content"
                >
                  <Link href={`/profile?userId=${userId}`}>
                    <User className="mr-3 size-4 shrink-0 text-content-muted" />
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
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content md:hidden"
            >
              <Bell className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content md:hidden">
              <Users className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border md:hidden" />

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
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content"
            >
              <Settings className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {/* 下载桌面端 */}
            {!runtime.isDesktop && (
              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content"
                onSelect={() => ProfileCallback("download")}
              >
                <Download className="mr-3 size-4 shrink-0 text-content-muted" />
                <span>{t("profile.menu.download")}</span>
              </DropdownMenuItem>
            )}

            {/* 关于我 */}
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-content-muted hover:bg-accent hover:text-content focus:bg-accent focus:text-content"
              onSelect={() => ProfileCallback("about")}
            >
              <Coffee className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.aboutMe")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-border" />

            {/* 登录/登出 放在最后 */}
            {isLoggedIn ? (
              <DropdownMenuItem
                onSelect={handleLogoutClick}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-3 size-4 shrink-0 text-destructive" />
                <span>{t("common.action.logout")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10 hover:text-brand-hover focus:bg-brand/10 focus:text-brand-hover"
              >
                <LogIn className="mr-3 size-4 shrink-0 text-brand" />
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
