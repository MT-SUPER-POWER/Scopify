"use client";

import { LoaderCircle, Send, Smile } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@scopify/ui/shadcn/components/popover";
import { MESSAGE_EMOJI } from "@/constants/inbox";
import { useI18n } from "@/store/module/i18n";
import type { PrivateMessageComposerProps } from "@/types/components/privateMessages";

export function PrivateMessageComposer({
  value,
  sending,
  disabled,
  error,
  onChange,
  onSend,
}: PrivateMessageComposerProps) {
  const { t } = useI18n();
  return (
    <form
      className="shrink-0 p-4 pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && value.trim()) onSend();
      }}
    >
      <div className="rounded-xl border border-border bg-foreground/3 p-3 focus-within:border-ring/60">
        <textarea
          value={value}
          disabled={disabled}
          maxLength={1000}
          rows={2}
          aria-label={t("privateMessages.compose")}
          placeholder={t("privateMessages.compose")}
          className="w-full resize-none bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-content-subtle disabled:opacity-50"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.nativeEvent.keyCode !== 229
            ) {
              event.preventDefault();
              if (!disabled && value.trim()) onSend();
            }
          }}
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="mr-auto text-xs text-content-subtle tabular-nums">
            {value.length}/1000
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={t("privateMessages.emoji")}
              >
                <Smile className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="grid w-48 grid-cols-4 gap-1 p-2">
              {MESSAGE_EMOJI.map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || value.length + emoji.length > 1000}
                  onClick={() => onChange(value + emoji)}
                  aria-label={emoji}
                >
                  {emoji}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
          <Button type="submit" variant="ghost" size="sm" disabled={disabled || !value.trim()}>
            {sending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {t(sending ? "privateMessages.sending" : "privateMessages.send")}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t("privateMessages.sendError")}
        </p>
      )}
    </form>
  );
}
