// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import Link from "next/link";
import {
  FiBell,
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
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { IS_ELECTRON } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="focus:outline-none focus:ring-0">{children}</button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-68 max-w-[calc(100vw-2rem)] rounded-xl p-2"
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
            <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[15px]">
              <Link href={`/profile?userId=${userId}`}>
                <FiUser className="mr-2 h-5 w-5" />
                <span>{t("profile.menu.profile")}</span>
              </Link>
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
                <span>{item.id === "download" ? t("profile.menu.download") : t("profile.menu.aboutMe")}</span>
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
              <span className="text-[#fe4144]">{t("common.action.logout")}</span>
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
  );
}
