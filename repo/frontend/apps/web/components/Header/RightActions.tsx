"use client";

import { Activity } from "lucide-react";
import { FriendsCenter } from "@/components/messages/FriendsCenter";
import Link from "next/link";
import { useI18n } from "@/store/module/i18n";
import { FaGithub } from "react-icons/fa";
import { cn } from "@/lib/utils";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const NAV_BTN =
  "bg-surface-sunken/80 hover:bg-surface-elevated text-content-muted hover:text-content transition-all";

const RightActions = () => {
  const { t } = useI18n();
  return (
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

      <Link
        href="/social"
        scroll={false}
        aria-label={t("social.title")}
        title={t("social.title")}
        className={cn("hidden size-10 items-center justify-center rounded-full md:flex", NAV_BTN)}
      >
        <Activity className="size-4.5" />
      </Link>

      <FriendsCenter />

      <ProfileMenu>
        <MockAvatar />
      </ProfileMenu>
    </div>
  );
};

export default RightActions;
