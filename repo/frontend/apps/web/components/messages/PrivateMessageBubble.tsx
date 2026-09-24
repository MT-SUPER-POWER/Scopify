"use client";

import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@scopify/ui/shadcn/components/avatar";
import { renderEmojiContent } from "@/components/Comment/renderEmojiContent";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PrivateMessageBubbleProps } from "@/types/components/privateMessages";
import { PrivateMessageCard } from "./PrivateMessageCard";

export function PrivateMessageBubble({ message }: PrivateMessageBubbleProps) {
  const { t } = useI18n();
  return (
    <article
      className={cn("flex items-start gap-2.5", message.own && "flex-row-reverse")}
      aria-label={message.sender.name}
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={message.sender.avatarUrl} alt="" />
        <AvatarFallback className="bg-foreground/7 text-content-muted">
          <UserRound className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[82%] space-y-3 rounded-2xl bg-foreground/7 p-3 text-sm leading-5",
          message.own ? "rounded-tr-md bg-foreground/12" : "rounded-tl-md",
        )}
      >
        {message.text && (
          <p className="wrap-anywhere whitespace-pre-wrap text-foreground">
            {renderEmojiContent(message.text)}
          </p>
        )}
        {message.attachment && <PrivateMessageCard attachment={message.attachment} />}
        {!message.text && !message.attachment && (
          <p className="text-content-muted">{t("privateMessages.unsupported")}</p>
        )}
      </div>
    </article>
  );
}
