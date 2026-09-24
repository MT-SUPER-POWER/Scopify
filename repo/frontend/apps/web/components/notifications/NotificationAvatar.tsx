"use client";

import { AtSign, BarChart3, Bell, Download, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@scopify/ui/shadcn/components/avatar";
import type { NotificationAvatarProps } from "@/types/components/notifications";

export function NotificationAvatar({ item }: NotificationAvatarProps) {
  const Icon =
    item.source === "updates"
      ? Download
      : item.category === "reports"
        ? BarChart3
        : item.category === "messages"
          ? MessageCircle
          : item.category === "interactions"
            ? AtSign
            : Bell;
  return (
    <Avatar size="lg" className="mt-0.5 shrink-0 data-[size=lg]:size-12">
      {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt="" className="object-cover" />}
      <AvatarFallback className="bg-foreground/7 text-content-muted">
        <Icon className="size-5" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );
}
