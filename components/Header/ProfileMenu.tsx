import { useIsElectron } from '@/lib/hooks/useElectronDetect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FiUser,
  FiDownload,
  FiSettings,
  FiLogOut,
  FiCoffee,
  FiLogIn,
} from "react-icons/fi";
import { useUserStore } from '@/store';
import Link from 'next/link';
import { useLoginStatus } from '@/lib/hooks/useLoginStatus';


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ProfileCallback = (label: string) => {
  switch (label) {
    case "":

    default:
      console.log(`Selected ${label} -- 功能待开发`);
  }
};

const iconList: { label: string; icon: React.ReactNode }[] = [
  { label: "Download", icon: <FiDownload className="mr-2 h-5 w-5" /> },
  { label: "Setting", icon: <FiSettings className="mr-2 h-5 w-5" /> },
  { label: "Buy Me A Coffee", icon: <FiCoffee className="mr-2 h-5 w-5" /> },
];

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const isElectron = useIsElectron();

  const handleLoginClick = () => {
    // DEBUG: 点击 login 不出现小窗口 - 调试点
    console.log("Electron 环境:", isElectron);

    if (typeof window !== "undefined" && isElectron) {
      window.electronAPI?.openLoginWindow();
    } else {
      window.location.href = '/login';
    }
  };

  const handleLogoutClick = () => {
    useUserStore.getState().handleLogout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-0">{children}</button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-68 max-w-[calc(100vw-2rem)] rounded-xl p-2"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuGroup className="space-y-1">
          {useLoginStatus() && (
            <DropdownMenuItem asChild className="rounded-lg px-3 py-2 text-[15px]">
              {/* TODO: 制作 Profile 页面 */}
              <Link href={"#"}>
                <FiUser className="mr-2 h-5 w-5" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
          )}

          {iconList.map((item) =>
            item.label === "Download" && useIsElectron() ? null : (
              <DropdownMenuItem
                key={item.label}
                className="rounded-lg px-3 py-2 text-[15px] -mt-1"
                onSelect={() => console.log(`Selected ${item.label}`)}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenuItem>
            )
          )}

          {/* 登录/登出 放在最后 */}
          {useLoginStatus() ? (
            <DropdownMenuItem onSelect={handleLogoutClick} className="rounded-lg px-3 py-2 text-[15px]">
              <FiLogOut className="mr-2 h-5 w-5" />
              <span>Logout</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleLoginClick} className="rounded-lg px-3 py-2 text-[15px]">
              <FiLogIn className="mr-2 h-5 w-5" />
              <span>Login</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu >
  );
}
