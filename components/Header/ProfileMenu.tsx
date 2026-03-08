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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ProfileCallback = (label: string) => {
  switch (label) {
    case "":

    default:
      console.log(`Selected ${label} -- 功能待开发`);
  }
};

const iconList: { label: string; icon: React.ReactNode }[] = [
  { label: "Profile", icon: <FiUser className="mr-2 h-5 w-5" /> },
  { label: "Download", icon: <FiDownload className="mr-2 h-5 w-5" /> },
  { label: "Setting", icon: <FiSettings className="mr-2 h-5 w-5" /> },
  { label: "Buy Me A Coffee", icon: <FiCoffee className="mr-2 h-5 w-5" /> },
];

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const isElectron = useIsElectron();

  const handleLoginClick = () => {
    if (isElectron && (window as any).electronAPI) {
      (window as any).electronAPI.openLoginWindow();
    } else {
      // Web 环境下仍然走页面跳转
      window.location.href = '/login';
    }
  };

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
          {iconList.map((item) =>
            item.label === "Download" && useIsElectron() ? null : (
              <DropdownMenuItem
                key={item.label}
                className="rounded-lg px-3 py-2 text-[15px]"
                onSelect={() => console.log(`Selected ${item.label}`)}
              >
                {item.icon}
                <span>{item.label}</span>
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuGroup>

        <DropdownMenuGroup className="space-y-1">
          {/* TODO: 接入 useUserStore 来做状态管理切换 */}
          <DropdownMenuItem onSelect={handleLoginClick}>
            <FiLogIn className="mr-2 h-5 w-5" />
            <span>Login</span>
          </DropdownMenuItem>
          {/*
            { label: "Login", icon: <FiLogIn className="mr-2 h-5 w-5" /> },
            { label: "Logout", icon: <FiLogOut className="mr-2 h-5 w-5" /> },
          */}
        </DropdownMenuGroup>

      </DropdownMenuContent>
    </DropdownMenu >
  );
}
