"use client";

import { ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { ScrollArea } from "@scopify/ui/shadcn/components/scroll-area";
import { INBOX_SCROLL_CLASS } from "@/constants/inbox";
import { usePrivateConversation } from "@/hooks/messages/usePrivateConversation";
import { useConversationScroll } from "@/hooks/messages/useConversationScroll";
import { useI18n } from "@/store/module/i18n";
import type { PrivateConversationViewProps } from "@/types/components/privateMessages";
import { PrivateMessageBubble } from "./PrivateMessageBubble";
import { PrivateMessageComposer } from "./PrivateMessageComposer";

export function PrivateConversationView({ accountId, peer, onBack }: PrivateConversationViewProps) {
  const { t, locale } = useI18n();
  const conversation = usePrivateConversation(accountId, peer);
  const scroll = useConversationScroll(conversation.messages);
  return (
    <section
      className="flex h-[min(40rem,calc(100dvh-10rem))] min-h-0 flex-col text-foreground"
      aria-label={peer.name}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border p-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label={t("privateMessages.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
          {peer.name || t("privateMessages.unknownUser")}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={conversation.isFetching}
          onClick={() => void conversation.refetch()}
          aria-label={t("privateMessages.refresh")}
        >
          <RefreshCw className={conversation.isFetching ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </header>
      <ScrollArea
        ref={scroll.rootRef}
        type="hover"
        className={INBOX_SCROLL_CLASS}
        onScrollCapture={scroll.onScroll}
      >
        <div className="space-y-4 px-4 py-5 [contain:inline-size]">
          {conversation.hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-content-muted"
              disabled={conversation.isFetching}
              onClick={() => {
                scroll.beforeLoadOlder();
                void conversation.fetchNextPage();
              }}
            >
              {t(
                conversation.isFetchingNextPage
                  ? "privateMessages.loading"
                  : "privateMessages.older",
              )}
            </Button>
          )}
          {conversation.isPending && (
            <p
              role="status"
              className="flex items-center justify-center gap-2 py-16 text-sm text-content-muted"
            >
              <LoaderCircle className="size-4 animate-spin" />
              {t("privateMessages.loading")}
            </p>
          )}
          {conversation.isError && (
            <div role="alert" className="space-y-3 text-center text-sm text-content-muted">
              <p>{t("privateMessages.loadError")}</p>
              <Button variant="outline" size="sm" onClick={() => void conversation.refetch()}>
                {t("common.action.retry")}
              </Button>
            </div>
          )}
          {conversation.messages.map((message, index) => (
            <div key={message.id} className="space-y-4">
              {(index === 0 || message.time - conversation.messages[index - 1].time > 5 * 60_000) &&
                message.time > 0 && (
                  <p className="py-1 text-center text-xs text-content-subtle">
                    <time dateTime={new Date(message.time).toISOString()}>
                      {new Date(message.time).toLocaleString(locale, {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </p>
                )}
              <PrivateMessageBubble message={message} />
            </div>
          ))}
          {conversation.isSuccess && !conversation.messages.length && (
            <p className="py-16 text-center text-sm text-content-muted">
              {t("privateMessages.startConversation")}
            </p>
          )}
        </div>
      </ScrollArea>
      <PrivateMessageComposer
        value={conversation.draft}
        sending={conversation.sending}
        disabled={!conversation.isSuccess || conversation.sending || peer.id === accountId}
        error={conversation.sendError}
        onChange={conversation.setDraft}
        onSend={() => void conversation.sendMessage()}
      />
    </section>
  );
}
