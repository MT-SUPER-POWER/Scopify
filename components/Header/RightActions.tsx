import { cn } from "@/lib/utils";
import MockAvatar from "./MockAvatar";
import { Bell, Users } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

/**
 * RightActions: Header 右侧操作区
 */
const RightActions = () => (
  <div className="flex items-center gap-2">
    <button
      className={cn(
        "px-4 py-[7.5] rounded-full",
        "bg-white text-black font-bold text-sm hover:scale-110 transition-transform",
        "hidden xl:block",
      )}
    >
      Premium
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
