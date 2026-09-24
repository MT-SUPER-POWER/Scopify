import { FriendsCenter } from "@/components/messages/FriendsCenter";
import { FaGithub } from "react-icons/fa";
import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <button
      type="button"
      className={cn(
        "h-10 rounded-full px-4",
        "bg-surface-sunken/80 text-content-muted transition-all hover:scale-105 hover:bg-surface-elevated hover:text-content",
        "hidden items-center gap-2 xl:flex",
        "text-sm font-bold",
      )}
      onClick={() => window.open("https://github.com/MT-SUPER-POWER/scopify")}
    >
      <FaGithub className="size-5" />
      <span>Github</span>
    </button>

    <NotificationCenter />

    <FriendsCenter />

    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
