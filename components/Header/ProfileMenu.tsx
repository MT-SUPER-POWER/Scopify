// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Link from "next/link";
import { useState } from "react";
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
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VipSignModal } from "@/components/VipSign/VipSignModal";
import { vipSign, vipSignInfo } from "@/lib/api/user";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { VipSignRecord } from "@/types/api/vipSign";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const iconList: { id: "download" | "about"; icon: React.ReactNode }[] = [
  { id: "download", icon: <FiDownload className="mr-2 h-5 w-5" /> },
  { id: "about", icon: <FiCoffee className="mr-2 h-5 w-5" /> },
];

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  const isElectron = IS_ELECTRON;
  const smartRouter = useSmartRouter();
  const userId = useUserStore((state) => state.user?.userId);
  const isLoggedIn = useLoginStatus();

  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signRecords, setSignRecords] = useState<VipSignRecord[]>([]);
  const [hasFetchedSign, setHasFetchedSign] = useState(false);
  const [hasSignedInToday, setHasSignedInToday] = useState(false);
  const [isSignLoading, setIsSignLoading] = useState(false);

  const fetchSignInfo = async () => {
    if (!isLoggedIn) return;
    try {
      setIsSignLoading(true);
      const cookie =
        typeof window !== "undefined"
          ? localStorage.getItem("music_cookie")
          : null;
      const info = await vipSignInfo(cookie ?? undefined);
      const records = info.data?.data ?? [];
      const signedToday = records.some((r) => r.today);
      setHasSignedInToday(signedToday);
      setSignRecords(records);
      setHasFetchedSign(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSignLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && isLoggedIn && !hasFetchedSign) {
      fetchSignInfo();
    }
  };

  const handleVipSign = async (e: React.MouseEvent) => {
    // 阻止冒泡，避免触发 DropdownMenuItem 的默认行为（如果需要自行控制）
    // 但 Radix DropdownMenuItem 点击内部 button 也会自动关闭 menu，这通常是我们想要的，所以可以不阻止
    if (isSignLoading) return;

    if (hasSignedInToday) {
      setSignModalOpen(true);
      return;
    }

    const cookie =
      typeof window !== "undefined"
        ? localStorage.getItem("music_cookie")
        : null;
    try {
      setIsSignLoading(true);
      const res = await vipSign(cookie ?? undefined);
      const signData = res.data;

      // 无论成功还是重复签到，都重新拉取一次月签记录并弹窗
      if (signData.code === 200 || signData.code === -2) {
        const info = await vipSignInfo(cookie ?? undefined);
        const records = info.data?.data ?? [];
        setSignRecords(records);
        setHasSignedInToday(records.some((r) => r.today));
        setSignModalOpen(true);
        if (signData.code === 200) {
          toast.success(t("vipSign.success", { message: "签到成功" }));
        }
      } else {
        toast.error(signData.message || t("vipSign.failed", { message: "" }));
      }
    } catch (err: any) {
      const msg = err?.businessMsg || err?.message || "";
      if (msg.includes("已经") || msg.includes("重复")) {
        // 如果错误信息提示已经签到，也拉取记录并展示
        const info = await vipSignInfo(cookie ?? undefined).catch(() => null);
        if (info) {
          const records = info.data?.data ?? [];
          setSignRecords(records);
          setHasSignedInToday(true);
          setSignModalOpen(true);
        }
      } else {
        toast.error(t("vipSign.failed", { message: msg }));
      }
    } finally {
      setIsSignLoading(false);
    }
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
        window.location.replace(
          "https://github.com/MT-SUPER-POWER/Scopify/releases",
        );
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
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="focus:outline-none focus:ring-0">
            {children}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-68 max-w-[calc(100vw-2rem)] rounded-xl p-2 bg-[#282828] text-white border-white/10"
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup className="space-y-1">
            {/* 小屏才显示的 Bell / Friends */}
            <DropdownMenuItem className="rounded-lg px-3 py-2 text-[15px] md:hidden">
              <FiBell className="mr-2 h-5 w-5" />
              <span>{t("profile.menu.notifications")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg px-3 py-2 text-[15px] md:hidden">
              <FiUsers className="mr-2 h-5 w-5" />
              <span>{t("profile.menu.friends")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />

            {/* 简介 */}
            {isLoggedIn && (
              <DropdownMenuItem
                asChild
                className="rounded-lg px-3 py-2 text-[15px]"
              >
                <Link href={`/profile?userId=${userId}`}>
                  <FiUser className="mr-2 h-5 w-5" />
                  <span>{t("profile.menu.profile")}</span>
                </Link>
              </DropdownMenuItem>
            )}

            {/* 网易乐签 */}
            {isLoggedIn && (
              <DropdownMenuItem className="rounded-lg px-3 py-2 text-[15px]">
                <div className="flex flex-row w-full justify-between items-center">
                  <div className="flex flex-row items-center">
                    <FiCalendar className="mr-2 h-5 w-5" />
                    <span>{t("profile.menu.vipSign")}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleVipSign}
                    disabled={isSignLoading}
                    className={`min-w-[4rem] px-3 h-7 rounded-full text-base font-bold transition-all disabled:opacity-70 ${
                      hasSignedInToday
                        ? "bg-transparent border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400"
                        : "bg-[#1ed760] text-black hover:bg-[#1fdf64] hover:scale-105"
                    }`}
                  >
                    {isSignLoading
                      ? "..."
                      : hasSignedInToday
                        ? t("profile.menu.viewMonthlySign")
                        : t("profile.menu.signIn")}
                  </button>
                </div>
              </DropdownMenuItem>
            )}

            {/* 设置 */}
            <DropdownMenuItem
              onSelect={() => smartRouter.push("/setting")}
              className="rounded-lg px-3 py-2 text-[15px]"
            >
              <FiSettings className="mr-2 h-5 w-5" />
              <span>{t("profile.menu.settings")}</span>
            </DropdownMenuItem>

            {iconList.map((item) =>
              item.id === "download" && IS_ELECTRON ? null : (
                <DropdownMenuItem
                  key={item.id}
                  className="rounded-lg px-3 py-2 text-[15px]"
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
                className="rounded-lg px-3 py-2 text-[15px]"
              >
                <FiLogOut className="text-[#fe4144] mr-2 h-5 w-5" />
                <span className="text-[#fe4144]">
                  {t("common.action.logout")}
                </span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={handleLoginClick}
                className="rounded-lg px-3 py-2 text-[15px]"
              >
                <FiLogIn className="mr-2 h-5 w-5" />
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
          signRecords={signRecords}
        />
      )}
    </>
  );
}
