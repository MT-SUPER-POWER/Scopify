"use client";

import { Users } from "lucide-react";
import { InboxPopover } from "@/components/inbox/InboxPopover";
import { useFriendsCenter } from "@/hooks/messages/useFriendsCenter";
import { useI18n } from "@/store/module/i18n";
import { FriendsPanel } from "./FriendsPanel";

export function FriendsCenter() {
  const center = useFriendsCenter();
  const { t } = useI18n();
  return (
    <InboxPopover
      open={center.open}
      onOpenChange={center.setOpen}
      title={t("privateMessages.title")}
      alignOffset={-32}
      trigger={
        <button
          type="button"
          aria-label={`${t("privateMessages.title")} · ${t("privateMessages.unread", { count: center.unreadCount })}`}
          className="hidden size-10 items-center justify-center rounded-full bg-surface-sunken/80 text-content-muted transition-colors hover:bg-surface-elevated hover:text-content focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:flex"
        >
          <span className="relative inline-flex size-4.5" aria-hidden="true">
            <Users className="size-4.5" />
            {center.unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success ring-2 ring-surface" />
            )}
          </span>
        </button>
      }
    >
      <FriendsPanel {...center} />
    </InboxPopover>
  );
}
