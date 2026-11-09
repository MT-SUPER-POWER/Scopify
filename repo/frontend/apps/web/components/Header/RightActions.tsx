"use client";

import { FriendsCenter } from "@/components/messages/FriendsCenter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { CapabilityGate } from "@/components/provider/CapabilityGate";
import MockAvatar from "./Avatar";
import { ProfileMenu } from "./ProfileMenu";

const RightActions = () => (
  <div className="flex flex-row items-center gap-2">
    <CapabilityGate requires="messages">
      <NotificationCenter />
      <FriendsCenter />
    </CapabilityGate>
    <ProfileMenu>
      <MockAvatar />
    </ProfileMenu>
  </div>
);

export default RightActions;
