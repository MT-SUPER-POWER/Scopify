"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useSocialAccount, useSocialMessages } from "@/hooks/social/useSocialQueries";
import { useSocialSendMessage } from "@/hooks/social/useSocialConversation";
import { uniqueById } from "@/lib/social/normalize";
import { useI18n } from "@/store/module/i18n";
import type { SocialMessageDialogProps } from "@/types/components/social";
import { SocialAvatar, SocialLoadMore, SocialState } from "./SocialPrimitives";
import { SocialResourceCard } from "./SocialResourceCard";
import s from "./Social.module.css";

export function SocialMessageDialog({ user, open, onClose }: SocialMessageDialogProps) {
  const { t, locale } = useI18n(),
    { uid } = useSocialAccount();
  const query = useSocialMessages(user.id, open),
    send = useSocialSendMessage(user.id);
  const [text, setText] = useState(""),
    viewport = useRef<HTMLDivElement>(null);
  const items = uniqueById(query.data?.pages.flatMap((page) => page.items) ?? []).sort(
    (a, b) => a.time - b.time,
  );
  const latest = items.at(-1)?.id;
  useEffect(() => {
    if (open && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [latest, open]);
  async function submit() {
    if (!text.trim() || send.isPending) return;
    try {
      await send.mutateAsync(text.trim());
      setText("");
    } catch {
      /* Preserve the message. */
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !send.isPending) onClose();
      }}
    >
      <DialogContent className={s.dialog + " sm:max-w-xl"}>
        <DialogTitle className={s.row}>
          <SocialAvatar user={user} size="small" linked={false} />
          {user.name}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("social.message")}</DialogDescription>
        <div className={s.between}>
          <span className={s.muted}>{t("social.message")}</span>
          <button
            type="button"
            className={s.iconButton}
            disabled={query.isFetching}
            aria-label={t("social.refreshMessages")}
            onClick={() => void query.refetch()}
          >
            <RefreshCw />
          </button>
        </div>
        <SocialState
          loading={query.isPending}
          error={query.isError && !items.length}
          onRetry={() => void query.refetch()}
          empty={!items.length ? t("social.emptyMessages") : undefined}
        >
          <div className={s.messages} ref={viewport}>
            {(query.hasNextPage || query.isError) && (
              <SocialLoadMore
                more={query.hasNextPage}
                pending={query.isFetching}
                error={query.isError}
                onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
              />
            )}
            {items.map((item) => (
              <div key={item.id} className={s.message} data-self={item.from.id === uid}>
                <div className={s.bubble}>
                  {item.text || (!item.resource ? t("social.unknownMessage") : "")}
                  {item.resource && <SocialResourceCard resource={item.resource} compact />}
                </div>
                <time dateTime={item.time ? new Date(item.time).toISOString() : undefined}>
                  {item.time
                    ? new Date(item.time).toLocaleString(locale, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </time>
              </div>
            ))}
          </div>
        </SocialState>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <textarea
            className={s.textarea}
            rows={2}
            maxLength={500}
            value={text}
            disabled={send.isPending}
            aria-label={t("social.messagePlaceholder")}
            placeholder={t("social.messagePlaceholder")}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={s.row + " justify-end"}>
            <span className={s.counter}>{text.length}/500</span>
            <button
              type="submit"
              className={s.button + " " + s.primary}
              disabled={send.isPending || !text.trim()}
            >
              {t(send.isPending ? "social.sending" : "social.send")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
