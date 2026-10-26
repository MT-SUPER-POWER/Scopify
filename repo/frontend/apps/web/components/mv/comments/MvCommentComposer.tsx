"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { MvCommentComposerProps } from "@/types/components/mv";

/** 网易云评论的字数上限。 */
const MAX_LENGTH = 140;

/**
 * YouTube 式评论输入：头像 + 下划线输入框，聚焦或有内容时展开「取消 / 评论」，
 * 输入框随内容自动增高；Ctrl/⌘+Enter 发送。回复时以紧凑尺寸嵌在评论下方。
 */
export function MvCommentComposer({
  placeholder,
  submitLabel,
  compact = false,
  autoFocus = false,
  onFocus,
  onSubmit,
  onCancel,
}: MvCommentComposerProps) {
  const { t } = useI18n();
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

  return (
    <div className="flex gap-4">
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
          <div className="mt-2 flex items-center justify-end gap-2">
            {text.length > MAX_LENGTH * 0.8 && (
              <span
                className={cn(
                  "mr-auto text-xs tabular-nums",
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
              className="h-9 rounded-full px-4 text-sm font-medium text-content transition-colors hover:bg-content/10"
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
