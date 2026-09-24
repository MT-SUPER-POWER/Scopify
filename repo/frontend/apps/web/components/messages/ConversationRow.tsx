"use client";

import { ChevronRight, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@scopify/ui/shadcn/components/avatar";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { ConversationRowProps } from "@/types/components/privateMessages";

export function ConversationRow({ conversation, unread, onOpen }: ConversationRowProps) {
  const { t, locale } = useI18n();
  const date = new Date(conversation.time);
  const today = date.toDateString() === new Date().toDateString();
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-4 text-left transition-colors hover:bg-foreground/7 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        unread && "bg-foreground/7",
      )}
    >
      <Avatar size="lg" className="shrink-0 data-[size=lg]:size-12">
        <AvatarImage src={conversation.avatarUrl} alt="" />
        <AvatarFallback className="bg-foreground/7 text-content-muted">
          <UserRound className="size-5" />
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
            {conversation.name || t("privateMessages.unknownUser")}
          </span>
          {unread && (
            <span className="size-1.5 shrink-0 rounded-full bg-success">
              <span className="sr-only">{t("notifications.unread")}</span>
            </span>
          )}
          {conversation.time > 0 && (
            <time
              className="ml-auto shrink-0 text-xs text-content-muted"
              dateTime={date.toISOString()}
            >
              {today
                ? date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
                : date.toLocaleDateString(locale, { month: "2-digit", day: "2-digit" })}
            </time>
          )}
        </span>
        <span className="mt-1.5 line-clamp-2 text-sm leading-5 break-words text-content-muted">
          {conversation.preview || t("privateMessages.sharedContent")}
        </span>
      </span>
      <ChevronRight className="mt-1 size-3.5 shrink-0 text-content-muted" aria-hidden="true" />
    </button>
  );
}
