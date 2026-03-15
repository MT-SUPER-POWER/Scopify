"use client";

import { useState, useRef } from 'react';
import { Hash, AtSign, Smile, Loader2 } from 'lucide-react';
import { NeteaseComment } from '@/types/api/music';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import emojiData from '@/resources/emoji.json';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function CommentInputBox({
  replyTarget,
  onCancelReply,
  onSubmit
}: {
  replyTarget: NeteaseComment | null;
  onCancelReply: () => void;
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // 解析 contentEditable 内的真实文本内容（将表情图片还原回 [表情] 字符串）
  const parseEditorContent = () => {
    if (!editorRef.current) return '';
    let text = '';

    const traverse = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeName === 'IMG') {
        text += (node as HTMLImageElement).alt || '';
      } else if (node.nodeName === 'BR') {
        text += '\n';
      } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
        // Handle line breaks visually represented by divs
        if (text !== '' && !text.endsWith('\n')) text += '\n';
        node.childNodes.forEach(traverse);
      } else {
        node.childNodes.forEach(traverse);
      }
    };

    editorRef.current.childNodes.forEach(traverse);
    return text.replace(/\u00A0/g, ' '); // 将 nbsp 转回普通空格
  };

  const handleInput = () => {
    setInputText(parseEditorContent());
  };

  const insertContent = (content: string | Node) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // 光标如果不在编辑器里，将其移动到编辑器末尾
      if (!editorRef.current.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }

      range.deleteContents();
      const el = typeof content === 'string' ? document.createTextNode(content) : content;
      range.insertNode(el);

      // 把光标挪到插入元素之后
      range.setStartAfter(el);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // 没有任何选区的情况，直接追加
      const el = typeof content === 'string' ? document.createTextNode(content) : content;
      editorRef.current.appendChild(el);
    }
    handleInput();
  };

  const handleEmojiClick = (name: string, url: string) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = `[${name}]`;
    img.title = name;
    img.style.display = 'inline-block';
    img.style.width = '20px';
    img.style.height = '20px';
    img.style.verticalAlign = 'text-bottom';
    img.style.margin = '0 2px';
    img.contentEditable = 'false'; // 防止对图片内部进行编辑
    insertContent(img);
  };

  const handleSubmit = async () => {
    const finalTxt = parseEditorContent().trim();
    if (!finalTxt || finalTxt.length > 140) return;

    setIsSubmitting(true);
    const success = await onSubmit(finalTxt);
    if (success) {
      setInputText('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className={
      cn(
        "sticky bottom-4 z-50 mb-12 shadow-2xl transition-all",
        " backdrop-blur-xl border border-white/10 rounded-xl p-4",
        "focus-within:border-white/30 focus-within:bg-[#202020]/95"
      )}>
      {replyTarget && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-md mb-2 text-sm text-[#1DB954]">
          <span>Reply to @{replyTarget.user.nickname}:</span>
          <button
            onClick={onCancelReply}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 改造后的可编辑区域 (ContentEditable) */}
      <div className="relative mb-2">
        {(!inputText || inputText.length === 0) && (
          <div className="absolute top-0 left-0 text-zinc-500 pointer-events-none text-sm select-none">
            {replyTarget ? `Give your reply...` : "Say something..."}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!isSubmitting}
          onInput={handleInput}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          className="w-full min-h-15 max-h-37.5 overflow-y-auto outline-none text-sm text-white break-words whitespace-pre-wrap leading-relaxed py-0.5"
        />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
        <div className="flex gap-4 text-[#B3B3B3]">
          <button onClick={() => insertContent("#TOPIC#")}>
            <Hash className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </button>
          <button onClick={() => insertContent("@USER_NAME ")}>
            <AtSign className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button>
                <Smile className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-80 bg-[#1c1c1c] border border-white/10 p-3 shadow-2xl mb-2 z-[100]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-8 gap-2 overflow-y-auto max-h-[220px] scrollbar-hide">
                {Object.entries(emojiData).map(([name, url]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEmojiClick(name, url);
                    }}
                    title={name}
                    className="hover:bg-white/10 p-1.5 rounded flex items-center justify-center transition-colors hover:scale-110 active:scale-95"
                  >
                    <img
                      src={url}
                      alt={name}
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
            onClick={handleSubmit}
            className="flex items-center justify-center bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-6 py-2 rounded-full scale-100 hover:scale-105 transition-all disabled:opacity-50 min-w-18"
            disabled={!inputText.trim() || inputText.length > 140 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (replyTarget ? "Reply" : "Publish")}
          </button>
        </div>
      </div>
    </div>
  );
}
