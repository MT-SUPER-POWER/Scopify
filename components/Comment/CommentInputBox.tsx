"use client";

import { AtSign, Hash, Loader2, Smile } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import emojiData from "@/resources/emoji.json";
import { useI18n } from "@/store/module/i18n";
import type { CommentInputBoxProps } from "@/types/components/comment";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CommentInputBox({ replyTarget, onCancelReply, onSubmit }: CommentInputBoxProps) {
  const { t } = useI18n();
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const parseEditorContent = () => {
    if (!editorRef.current) return "";
    let text = "";
    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node.nodeName === "IMG") {
        text += (node as HTMLImageElement).alt || "";
      } else if (node.nodeName === "BR") {
        text += "\n";
      } else if (node.nodeName === "DIV" || node.nodeName === "P") {
        if (text !== "" && !text.endsWith("\n")) text += "\n";
        node.childNodes.forEach(traverse);
      } else {
        node.childNodes.forEach(traverse);
      }
    };
    editorRef.current.childNodes.forEach(traverse);
    return text.replace(/\u00A0/g, " ");
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const handleInput = () => {
    setInputText(parseEditorContent());
    saveSelection();
  };

  // 修复：插入 [表情] 纯文本而不是图片
  const handleEmojiClick = (name: string, _url: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    // 恢复光标位置
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }

    // 插入 [表情] 纯文本
    document.execCommand("insertText", false, `[${name}]`);

    saveSelection();
    handleInput();
  };

  // 🎯 核心修复：拦截拷贝事件，将 img 标签转换为 alt 里的文本（如 [大笑]）
  const handleCopy = (e: React.ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    e.preventDefault();
    const range = selection.getRangeAt(0);
    const clone = range.cloneContents();

    // 遍历克隆出来的 DOM 树，把所有表情图片替换成文本节点
    const imgs = clone.querySelectorAll("img");
    imgs.forEach((img) => {
      const textNode = document.createTextNode(img.alt);
      img.parentNode?.replaceChild(textNode, img);
    });

    const div = document.createElement("div");
    div.appendChild(clone);

    // 将纯文本注入到剪贴板
    const plainText = div.innerText || div.textContent || "";
    e.clipboardData.setData("text/plain", plainText);
  };

  const handleSubmit = async () => {
    const finalTxt = parseEditorContent().trim();
    if (!finalTxt || finalTxt.length > 140) return;

    setIsSubmitting(true);
    const success = await onSubmit(finalTxt);
    if (success) {
      setInputText("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      savedRangeRef.current = null;
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className={cn(
        "relative z-50 transition-all",
        "rounded-xl border border-white/10 bg-[#121212]/40 p-4 backdrop-blur-xl",
        "focus-within:border-white/30 focus-within:bg-[#202020]/80",
      )}
    >
      {replyTarget && (
        <div className="mb-2 flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-[#1DB954]">
          <span>{t("comments.input.replyTo", { name: replyTarget.user.nickname })}</span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-zinc-500 transition-colors hover:text-white"
          >
            {t("comments.input.cancel")}
          </button>
        </div>
      )}

      <div className="relative mb-2">
        {(!inputText || inputText.length === 0) && (
          <div className="pointer-events-none absolute top-0 left-0 text-sm text-zinc-500 select-none">
            {replyTarget
              ? t("comments.input.replyPlaceholder")
              : t("comments.input.publishPlaceholder")}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!isSubmitting}
          onInput={handleInput}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onMouseLeave={saveSelection}
          onCopy={handleCopy} // 🎯 绑定自定义的 Copy 拦截器
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          className="max-h-37.5 min-h-15 w-full overflow-y-auto py-0.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-white outline-none"
        />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
        <div className="flex gap-4 text-[#B3B3B3]">
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertText", false, "#TOPIC#");
              handleInput();
            }}
          >
            <Hash className="h-5 w-5 cursor-pointer transition-colors hover:text-white" />
          </button>
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertText", false, "@USER_NAME ");
              handleInput();
            }}
          >
            <AtSign className="h-5 w-5 cursor-pointer transition-colors hover:text-white" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button type="button">
                <Smile className="h-5 w-5 cursor-pointer transition-colors hover:text-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={10}
              className="emoji-popover z-[100] w-80 border border-white/10 bg-[#1c1c1c] p-3 shadow-2xl"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="scrollbar-hide grid max-h-[220px] grid-cols-8 gap-2 overflow-y-auto">
                {Object.entries(emojiData).map(([name, url]) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={(e) => {
                      // 阻止默认事件，防止 contentEditable 失焦
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      // 阻止冒泡，防止外部点击事件导致模态关闭
                      e.preventDefault();
                      e.stopPropagation();
                      handleEmojiClick(name, url as string);
                    }}
                    title={name}
                    className="flex items-center justify-center rounded p-1.5 transition-colors hover:scale-110 hover:bg-white/10 active:scale-95"
                  >
                    <Image
                      src={url as string}
                      alt={name}
                      width={20}
                      height={20}
                      className="pointer-events-none h-5 w-5 object-contain select-none"
                    />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#B3B3B3]">{inputText.length}/140</span>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex min-w-18 scale-100 items-center justify-center rounded-full bg-[#1DB954] px-6 py-2 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-[#1ed760] disabled:opacity-50"
            disabled={!inputText.trim() || inputText.length > 140 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : replyTarget ? (
              t("common.action.reply")
            ) : (
              t("common.action.publish")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
