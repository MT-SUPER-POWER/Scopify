import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { Bell, Github, Users } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";

const NAV_BTN = "bg-black/50 hover:bg-black/70 text-zinc-500 hover:text-white transition-all";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <button
      className={cn(
        "px-4 h-10 rounded-full",
        "bg-white text-black hover:scale-105 transition-all",
        "hidden xl:flex items-center gap-2",
        "text-sm font-bold"
      )}
      onClick={() => window.open("https://github.com/MT-SUPER-POWER/scopify")}
    >
      <Github className="w-5 h-5" />
      <span>Github</span>
    </button>

    <button className={cn(
      "hidden md:flex items-center justify-center w-10 h-10 rounded-full",
      NAV_BTN,
    )}>
      <Bell className="w-4.5 h-4.5" />
    </button>

    <button className={cn(
      "hidden md:flex items-center justify-center w-10 h-10 rounded-full",
      NAV_BTN,
    )}>
      <Users className="w-4.5 h-4.5" />
    </button>

    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
