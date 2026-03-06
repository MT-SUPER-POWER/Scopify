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
} from "react-icons/fi";

export function ProfileMenu({ children }: { children?: React.ReactNode }) {
  const iconList: { label: string; icon: React.ReactNode }[] = [
    { label: "Profile", icon: <FiUser className="mr-2 h-5 w-5" /> },
    { label: "Download", icon: <FiDownload className="mr-2 h-5 w-5" /> },
    { label: "Setting", icon: <FiSettings className="mr-2 h-5 w-5" /> },
    { label: "Logout", icon: <FiLogOut className="mr-2 h-5 w-5" /> },
    { label: "Buy Me A Coffee", icon: <FiCoffee className="mr-2 h-5 w-5" /> },
  ];

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
          {iconList.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="rounded-lg px-3 py-2 text-[15px]"
              onSelect={() => console.log(`Selected ${item.label}`)}
            >
              {item.icon}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
