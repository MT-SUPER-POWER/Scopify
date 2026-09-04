// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import {
  Bell,
  ChevronRight,
  Coffee,
  Download,
  Footprints,
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
import type { ProfileMenuProps } from "@/types/components/profileMenu";

const menuItemClassName =
  "group cursor-pointer rounded-lg px-2.5 py-2.25 text-sm font-medium text-content-muted transition-colors hover:bg-accent hover:text-content focus:bg-accent focus:text-content";

export function ProfileMenu({ children }: ProfileMenuProps) {
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
  const handleVipSign = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
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

  const handleDownloadClick = () => {
    window.location.assign("https://github.com/MT-SUPER-POWER/Scopify/releases");
  };

  const handleAboutClick = () => {
    smartRouter.push("/me");
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
          className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/80 bg-surface-overlay/95 p-1.5 text-content shadow-floating backdrop-blur-xl"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-1">
            {/* 个人资料：融入菜单本身，而非再叠一层卡片。 */}
            {isLoggedIn && user ? (
              <DropdownMenuItem
                asChild
                className="group cursor-pointer rounded-xl p-2.5 transition-colors hover:bg-accent focus:bg-accent"
              >
                <Link href={`/profile?userId=${userId}`} className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border transition-all group-hover:scale-105 group-hover:ring-brand/40">
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
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-content transition-colors group-hover:text-brand">
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
              className={`${menuItemClassName} md:hidden`}
            >
              <Bell className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className={`${menuItemClassName} md:hidden`}>
              <Users className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 bg-border md:hidden" />

            {/* 签到是轻量状态，不压过主要导航。 */}
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

            {/* 音乐足迹 */}
            {isLoggedIn && (
              <DropdownMenuItem
                onSelect={() => smartRouter.push("/recent/report")}
                className={menuItemClassName}
              >
                <Footprints className="mr-3 size-4 shrink-0 text-content-muted" />
                <span>{t("profile.menu.listeningReport")}</span>
              </DropdownMenuItem>
            )}

            {/* 设置 */}
            <DropdownMenuItem
              onSelect={() => smartRouter.push("/setting")}
              className={menuItemClassName}
            >
              <Settings className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {/* 下载桌面端 */}
            {!runtime.isDesktop && (
              <DropdownMenuItem className={menuItemClassName} onSelect={handleDownloadClick}>
                <Download className="mr-3 size-4 shrink-0 text-content-muted" />
                <span>{t("profile.menu.download")}</span>
              </DropdownMenuItem>
            )}

            {/* 关于我 */}
            <DropdownMenuItem className={menuItemClassName} onSelect={handleAboutClick}>
              <Coffee className="mr-3 size-4 shrink-0 text-content-muted" />
              <span>{t("profile.menu.aboutMe")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-border" />

            {/* 登录/登出 放在最后 */}
            {isLoggedIn ? (
              <DropdownMenuItem
                onSelect={handleLogoutClick}
                className="cursor-pointer rounded-lg px-2.5 py-2.25 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-3 size-4 shrink-0 text-destructive" />
                <span>{t("common.action.logout")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="cursor-pointer rounded-lg px-2.5 py-2.25 text-sm font-medium text-brand transition-colors hover:bg-brand/10 hover:text-brand-hover focus:bg-brand/10 focus:text-brand-hover"
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
