"use client";

import { AtSign, Hash, Loader2, Smile } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import emojiData from "@/resources/emoji.json";
import { useI18n } from "@/store/module/i18n";
import type { NeteaseComment } from "@/types/api/music";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CommentInputBox({
  replyTarget,
  onCancelReply,
  onSubmit,
}: {
  replyTarget: NeteaseComment | null;
  onCancelReply: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}) {
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
        "backdrop-blur-xl border border-white/10 rounded-xl p-4 bg-[#121212]/40",
        "focus-within:border-white/30 focus-within:bg-[#202020]/80",
      )}
    >
      {replyTarget && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md mb-2 text-sm text-[#1DB954]">
          <span>{t("comments.input.replyTo", { name: replyTarget.user.nickname })}</span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            {t("comments.input.cancel")}
          </button>
        </div>
      )}

      <div className="relative mb-2">
        {(!inputText || inputText.length === 0) && (
          <div className="absolute top-0 left-0 text-zinc-500 pointer-events-none text-sm select-none">
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
          className="w-full min-h-15 max-h-37.5 overflow-y-auto outline-none text-sm text-white break-words whitespace-pre-wrap leading-relaxed py-0.5"
        />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
        <div className="flex gap-4 text-[#B3B3B3]">
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertText", false, "#TOPIC#");
              handleInput();
            }}
          >
            <Hash className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => {
              editorRef.current?.focus();
              document.execCommand("insertText", false, "@USER_NAME ");
              handleInput();
            }}
          >
            <AtSign className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button type="button">
                <Smile className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={10}
              className="emoji-popover w-80 bg-[#1c1c1c] border border-white/10 p-3 shadow-2xl z-[100]"
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-8 gap-2 overflow-y-auto max-h-[220px] scrollbar-hide">
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
                    className="hover:bg-white/10 p-1.5 rounded flex items-center justify-center transition-colors hover:scale-110 active:scale-95"
                  >
                    <Image
                      src={url as string}
                      alt={name}
                      width={20} height={20}
                      className="w-5 h-5 object-contain pointer-events-none select-none"
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
            className="flex items-center justify-center bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-6 py-2 rounded-full scale-100 hover:scale-105 transition-all disabled:opacity-50 min-w-18"
            disabled={!inputText.trim() || inputText.length > 140 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
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
