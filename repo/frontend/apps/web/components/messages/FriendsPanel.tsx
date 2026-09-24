"use client";

import { LoaderCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { ScrollArea } from "@scopify/ui/shadcn/components/scroll-area";
import { INBOX_SCROLL_CLASS } from "@/constants/inbox";
import { usePrivateConversations } from "@/hooks/messages/usePrivateConversations";
import { conversationUnread } from "@/lib/messages/normalize";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useI18n } from "@/store/module/i18n";
import type { FriendsPanelProps } from "@/types/components/privateMessages";
import { ConversationRow } from "./ConversationRow";
import { PrivateConversationView } from "./PrivateConversationView";

export function FriendsPanel(props: FriendsPanelProps) {
  const { t } = useI18n();
  const router = useSmartRouter();
  const query = usePrivateConversations(props.accountId, !props.peer);
  if (props.accountId && props.peer)
    return (
      <PrivateConversationView
        key={`${props.accountId}:${props.peer.id}`}
        accountId={props.accountId}
        peer={props.peer}
        onBack={props.back}
      />
    );
  return (
    <section className="flex h-[min(40rem,calc(100dvh-10rem))] min-h-0 flex-col text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{t("privateMessages.title")}</h2>
        {props.unreadCount > 0 && (
          <span className="text-xs text-content-muted">
            {t("privateMessages.unread", { count: props.unreadCount })}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          disabled={!props.accountId || query.isFetching}
          aria-label={t("privateMessages.refresh")}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </header>
      {!props.accountId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-sm text-content-muted">
          <MessageCircle className="size-8 opacity-60" />
          <p>{t("privateMessages.login")}</p>
          <Button
            onClick={() => {
              props.setOpen(false);
              router.push("/login");
            }}
          >
            {t("common.action.login")}
          </Button>
        </div>
      ) : (
        <ScrollArea type="hover" className={INBOX_SCROLL_CLASS}>
          <div className="space-y-1 p-3 [contain:inline-size]">
            {query.isPending && (
              <p
                role="status"
                className="flex items-center justify-center gap-2 py-16 text-sm text-content-muted"
              >
                <LoaderCircle className="size-4 animate-spin" />
                {t("privateMessages.loading")}
              </p>
            )}
            {query.isError && (
              <div role="alert" className="space-y-3 px-3 py-6 text-sm text-content-muted">
                <p>{t("privateMessages.loadError")}</p>
                <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                  {t("common.action.retry")}
                </Button>
              </div>
            )}
            {query.conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                unread={conversationUnread(conversation, props.snapshot?.items ?? [])}
                onOpen={() => props.openConversation(conversation)}
              />
            ))}
            {query.isSuccess && !query.conversations.length && (
              <p className="py-16 text-center text-sm text-content-muted">
                {t("privateMessages.empty")}
              </p>
            )}
            {query.hasNextPage && (
              <Button
                variant="ghost"
                className="w-full"
                disabled={query.isFetching}
                onClick={() => void query.fetchNextPage()}
              >
                {t(query.isFetchingNextPage ? "privateMessages.loading" : "privateMessages.more")}
              </Button>
            )}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
