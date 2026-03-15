import React from "react";

// 读取 emoji.json 并生成映射
import emojiMapRaw from "@/resources/emoji.json";
const emojiMap: Record<string, string> = emojiMapRaw;

/**
 * 将评论内容中的 [表情] 替换为图片
 * @param content 评论内容
 * @returns ReactNode
 */
export function renderEmojiContent(content: string) {
  // 匹配 [表情]，如 [狗]
  const regex = /\[([\u4e00-\u9fa5A-Za-z0-9]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // 普通文本
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    // emoji
    const emojiName = match[1];
    const emojiUrl = emojiMap[emojiName];
    if (emojiUrl) {
      parts.push(
        <img
          key={match.index}
          src={emojiUrl}
          alt={emojiName}
          className="inline-block w-6 h-6 align-middle mx-0.5"
          style={{ verticalAlign: "middle" }}
        />
      );
    } else {
      // 未匹配到表情，原样输出
      parts.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  // 剩余文本
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  return parts;
}
