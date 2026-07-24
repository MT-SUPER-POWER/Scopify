// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Link from "next/link";
import {
  FiBell,
  FiCalendar,
  FiCoffee,
  FiDownload,
  FiLogIn,
  FiLogOut,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VipSignModal } from "@/components/VipSign/VipSignModal";
import { useVipSign } from "@/hooks/vipSign/useVipSign";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useState } from "react";
import type { VipSignDetail } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const iconList: { id: "download" | "about"; icon: React.ReactNode }[] = [
  { id: "download", icon: <FiDownload className="mr-2 size-5 shrink-0" /> },
  { id: "about", icon: <FiCoffee className="mr-2 size-5 shrink-0" /> },
];

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  const isElectron = IS_ELECTRON;
  const smartRouter = useSmartRouter();
  const userId = useUserStore((state) => state.user?.userId);
  const isLoggedIn = useLoginStatus();

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [modalTodayRecord, setModalTodayRecord] = useState<VipSignDetail | undefined>(undefined);

  const {
    hasSignedToday,
    isLoading: isSignLoading,
    doSign,
    isSigning,
    fetchTodayRecord,
  } = useVipSign();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 点击"签到"或"查看月签"统一走 POST /vip/sign 拿 Modal 数据
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleVipSign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSignLoading || isSigning) return;

    let record: VipSignDetail | undefined;

    if (hasSignedToday) {
      // 已签到 → 直接调 /vip/sign 拿今日详情
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="focus:ring-0 focus:outline-none">
            {children}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border-white/10 bg-[#282828] p-2 text-white"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-0.5">
            {/* 小屏才显示的 Bell / Friends */}
            <DropdownMenuItem className="rounded-lg px-3 py-2.5 text-[15px] md:hidden">
              <FiBell className="mr-3 size-5 shrink-0" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg px-3 py-2.5 text-[15px] md:hidden">
              <FiUsers className="mr-3 size-5 shrink-0" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />

            {/* 简介 */}
            {isLoggedIn && (
              <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-[15px]">
                <Link href={`/profile?userId=${userId}`}>
                  <FiUser className="mr-3 size-5 shrink-0" />
                  <span className="flex-1">{t("profile.menu.profile")}</span>
                </Link>
              </DropdownMenuItem>
            )}

            {/* 网易乐签 */}
            {isLoggedIn && (
              <DropdownMenuItem
                className="rounded-lg px-3 py-2.5 text-[15px]"
                onSelect={(e) => e.preventDefault()}
              >
                <FiCalendar className="mr-3 size-5 shrink-0" />
                <span className="flex-1">{t("profile.menu.vipSign")}</span>
                <button
                  type="button"
                  onClick={handleVipSign}
                  disabled={isSignLoading || isSigning}
                  className={`ml-2 h-7 min-w-18 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-all disabled:opacity-60 ${
                    hasSignedToday
                      ? "border border-zinc-600 bg-transparent text-zinc-300 hover:border-zinc-400 hover:text-white"
                      : "bg-[#1ed760] text-black hover:scale-105 hover:bg-[#1fdf64]"
                  }`}
                >
                  {isSignLoading || isSigning
                    ? "..."
                    : hasSignedToday
                      ? t("profile.menu.viewMonthlySign")
                      : t("profile.menu.signIn")}
                </button>
              </DropdownMenuItem>
            )}

            {/* 设置 */}
            <DropdownMenuItem
              onSelect={() => smartRouter.push("/setting")}
              className="rounded-lg px-3 py-2.5 text-[15px]"
            >
              <FiSettings className="mr-3 size-5 shrink-0" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {iconList.map((item) =>
              item.id === "download" && IS_ELECTRON ? null : (
                <DropdownMenuItem
                  key={item.id}
                  className="rounded-lg px-3 py-2.5 text-[15px]"
                  onSelect={() => ProfileCallback(item.id)}
                >
                  {item.icon}
                  <span>
                    {item.id === "download"
                      ? t("profile.menu.download")
                      : t("profile.menu.aboutMe")}
                  </span>
                </DropdownMenuItem>
              ),
            )}

            {/* 登录/登出 放在最后 */}
            {isLoggedIn ? (
              <DropdownMenuItem
                onSelect={handleLogoutClick}
                className="rounded-lg px-3 py-2.5 text-[15px]"
              >
                <FiLogOut className="mr-3 size-5 shrink-0 text-[#fe4144]" />
                <span className="text-[#fe4144]">{t("common.action.logout")}</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="rounded-lg px-3 py-2.5 text-[15px]"
              >
                <FiLogIn className="mr-3 size-5 shrink-0" />
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
