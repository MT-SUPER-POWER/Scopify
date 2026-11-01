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
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { SocialMessageDialogProps } from "@/types/social/components";
import { SocialAvatar, SocialLoadMore, SocialState } from "@/components/social/SocialPrimitives";
import { SocialResourceCard } from "@/components/social/SocialResourceCard";
import { cn } from "@/lib/utils";
import {
  socialBetweenClass,
  socialButtonClass,
  socialCounterClass,
  socialDialogClass,
  socialIconButtonClass,
  socialMutedClass,
  socialPrimaryClass,
  socialRowClass,
  socialTextareaClass,
} from "@/components/social/socialClasses";

export function SocialMessageDialog({ user, open, onClose }: SocialMessageDialogProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale),
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
      <DialogContent className={cn(socialDialogClass, "sm:max-w-xl")}>
        <DialogTitle className={socialRowClass}>
          <SocialAvatar user={user} size="small" linked={false} />
          {user.name}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("social.message")}</DialogDescription>
        <div className={socialBetweenClass}>
          <span className={socialMutedClass}>{t("social.message")}</span>
          <button
            type="button"
            className={socialIconButtonClass}
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
          <div
            className="flex max-h-[45dvh] flex-col gap-4 overflow-y-auto px-1 py-2.5"
            ref={viewport}
          >
            {(query.hasNextPage || query.isError) && (
              <SocialLoadMore
                more={query.hasNextPage}
                pending={query.isFetching}
                error={query.isError}
                onLoad={() => void (query.isRefetchError ? query.refetch() : query.fetchNextPage())}
              />
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="max-w-[88%] self-start data-[self=true]:self-end"
                data-self={item.from.id === uid}
              >
                <div
                  className={cn(
                    "leading-1.7 rounded-[14px] bg-secondary px-4 py-3 text-[14px] wrap-anywhere whitespace-pre-wrap",
                    item.from.id === uid &&
                      "bg-[color:color-mix(in_srgb,var(--primary)_12%,var(--secondary))]",
                  )}
                >
                  {item.text || (!item.resource ? t("social.unknownMessage") : "")}
                  {item.resource && <SocialResourceCard resource={item.resource} compact />}
                </div>
                <time
                  className="mx-[3px] mt-[5px] block text-[11px] text-muted-foreground"
                  dateTime={item.time ? new Date(item.time).toISOString() : undefined}
                >
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
            className={socialTextareaClass}
            rows={2}
            maxLength={500}
            value={text}
            disabled={send.isPending}
            aria-label={t("social.messagePlaceholder")}
            placeholder={t("social.messagePlaceholder")}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={cn(socialRowClass, "justify-end")}>
            <span className={socialCounterClass}>{text.length}/500</span>
            <button
              type="submit"
              className={cn(socialButtonClass, socialPrimaryClass)}
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
