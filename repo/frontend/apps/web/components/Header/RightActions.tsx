"use client";

import { FriendsCenter } from "@/components/messages/FriendsCenter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <NotificationCenter />
    <FriendsCenter />
    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
