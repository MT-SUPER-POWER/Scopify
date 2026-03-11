import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { Bell, Github, Users } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

/**
 * RightActions: Header 右侧操作区
 */
const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <button
      className={cn(
        "px-3 py-[7.5] rounded-full",
        "bg-white text-black   over:scale-110 transition-transform",
        "hidden xl:flex",
        "items-center gap-2"
      )}
      onClick={() => window.open("https://github.com/MT-SUPER-POWER/scopify")}
    >
      <Github />
      <span className="text-sm font-bold"> Github </span>
    </button>
    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-zinc-400 hover:text-white hover:scale-105 transition-transform">
      <Bell className="w-5 h-5" />
    </button>
    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-zinc-400 hover:text-white hover:scale-105 transition-transform">
      <Users className="w-5 h-5" />
    </button>
    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
