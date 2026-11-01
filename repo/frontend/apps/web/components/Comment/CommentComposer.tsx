"use client";

import { Smile } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import emojiData from "@/resources/emoji.json";
import { useUserStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { CommentComposerProps } from "@/types/comment/components";

/** 网易云评论的字数上限。 */
const MAX_LENGTH = 140;

/**
 * YouTube 式评论输入：头像 + 下划线输入框，聚焦或有内容时展开「表情 / 取消 / 评论」，
 * 输入框随内容自动增高；Ctrl/⌘+Enter 发送。回复时以紧凑尺寸嵌在评论下方。
 */
export function CommentComposer({
  placeholder,
  submitLabel,
  compact = false,
  autoFocus = false,
  onFocus,
  onSubmit,
  onCancel,
}: CommentComposerProps) {
  const { t } = useTranslation();
  const avatarUrl = useUserStore((state) => state.user?.avatarUrl);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isActive, setIsActive] = useState(autoFocus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const canSubmit = text.trim().length > 0 && text.length <= MAX_LENGTH && !isSubmitting;

  const resize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const reset = () => {
    setText("");
    setIsActive(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    const ok = await onSubmit(text.trim());
    setIsSubmitting(false);
    if (ok) reset();
  };

  /** 在光标处插入 [表情名]，插入后光标落在它后面。 */
  const insertEmoji = (name: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? text.length;
    const end = textarea?.selectionEnd ?? start;
    const token = `[${name}]`;
    setText(text.slice(0, start) + token + text.slice(end));
    setIsActive(true);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start + token.length, start + token.length);
      resize();
    });
  };

  return (
    <div className={cn("flex", compact ? "gap-3" : "gap-4")}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-surface-elevated",
          compact ? "size-6" : "size-10",
        )}
      >
        {avatarUrl && (
          <Image
            fill
            sizes="40px"
            src={getSizedImageUrl(avatarUrl, 120)}
            alt=""
            className="object-cover"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          placeholder={placeholder}
          onFocus={() => {
            setIsActive(true);
            onFocus?.();
          }}
          onChange={(event) => {
            setText(event.target.value);
            resize();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void submit();
            }
          }}
          className="block w-full resize-none overflow-hidden border-b border-content/20 bg-transparent pb-1 text-sm leading-5 text-content outline-none placeholder:text-content-muted focus:border-content"
        />
        {isActive && (
          <div className="mt-2 flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t("comments.input.emoji")}
                  className="flex size-9 items-center justify-center rounded-full text-content transition-colors hover:bg-content/10"
                >
                  <Smile className="size-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="emoji-popover z-100 w-80 border bg-popover p-3 text-popover-foreground shadow-floating"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <div className="scrollbar-none grid max-h-55 grid-cols-8 gap-2 overflow-y-auto">
                  {Object.entries(emojiData).map(([name, url]) => (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => insertEmoji(name)}
                      className="flex items-center justify-center rounded p-1.5 transition-colors hover:scale-110 hover:bg-content/10 active:scale-95"
                    >
                      <Image
                        src={url as string}
                        alt={name}
                        width={20}
                        height={20}
                        className="pointer-events-none size-5 object-contain select-none"
                      />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {text.length > MAX_LENGTH * 0.8 && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  text.length > MAX_LENGTH ? "text-destructive" : "text-content-muted",
                )}
              >
                {text.length} / {MAX_LENGTH}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                reset();
                onCancel?.();
              }}
              className="ml-auto h-9 rounded-full px-4 text-sm font-medium text-content transition-colors hover:bg-content/10"
            >
              {t("comments.input.cancel")}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => void submit()}
              className="h-9 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:bg-content/10 disabled:text-content-subtle"
            >
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
