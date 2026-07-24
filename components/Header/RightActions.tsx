import { Bell, Users } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";

const NAV_BTN = "bg-black/50 hover:bg-black/70 text-zinc-500 hover:text-white transition-all";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <button
      type="button"
      className={cn(
        "h-10 rounded-full px-4",
        "bg-white text-black transition-all hover:scale-105",
        "hidden items-center gap-2 xl:flex",
        "text-sm font-bold",
      )}
      onClick={() => window.open("https://github.com/MT-SUPER-POWER/scopify")}
    >
      <FaGithub className="size-5" />
      <span>Github</span>
    </button>

    <button
      type="button"
      className={cn("hidden size-10 items-center justify-center rounded-full md:flex", NAV_BTN)}
    >
      <Bell className="size-4.5" />
    </button>

    <button
      type="button"
      className={cn("hidden size-10 items-center justify-center rounded-full md:flex", NAV_BTN)}
    >
      <Users className="size-4.5" />
    </button>

    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
