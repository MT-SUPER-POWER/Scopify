"use client";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@scopify/ui/shadcn/components/message-scroller";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnMessageScrollerPreview({ name }: ShadcnPreviewProps) {
  if (name !== "shadcn-message-scroller") return null;

  return (
    <MessageScrollerProvider>
      <MessageScroller className="h-64 w-full max-w-lg rounded-xl border">
        <MessageScrollerViewport className="p-4">
          <MessageScrollerContent className="gap-4">
            {Array.from({ length: 8 }, (_, index) => (
              <MessageScrollerItem key={index} scrollAnchor={index === 7}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    index % 2 === 0 ? "bg-muted" : "bg-primary text-primary-foreground ml-auto"
                  }`}
                >
                  {index % 2 === 0
                    ? `这是第 ${index + 1} 条推荐请求。`
                    : `已生成第 ${index + 1} 组音乐建议。`}
                </div>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
