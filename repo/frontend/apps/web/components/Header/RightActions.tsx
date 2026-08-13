import { Users } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";
import { UpdateNotificationCenter } from "./UpdateNotificationCenter";

const NAV_BTN =
  "bg-surface-sunken/80 hover:bg-surface-elevated text-content-muted hover:text-content transition-all";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <button
      type="button"
      className={cn(
        "h-10 rounded-full px-4",
        "bg-surface-sunken/80 text-content-muted hover:bg-surface-elevated hover:text-content transition-all hover:scale-105",
        "hidden items-center gap-2 xl:flex",
        "text-sm font-bold",
      )}
      onClick={() => window.open("https://github.com/MT-SUPER-POWER/scopify")}
    >
      <FaGithub className="size-5" />
      <span>Github</span>
    </button>

    <UpdateNotificationCenter />

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
