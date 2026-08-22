"use client";

import { Bot, CheckCircle2, FileAudio, X } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@scopify/ui/shadcn/components/attachment";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@scopify/ui/shadcn/components/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@scopify/ui/shadcn/components/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@scopify/ui/shadcn/components/message";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnConversationPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-attachment":
      return (
        <Attachment>
          <AttachmentMedia>
            <FileAudio />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>夜曲.flac</AttachmentTitle>
            <AttachmentDescription>28.4 MB · 上传完成</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="移除附件">
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      );
    case "shadcn-bubble":
      return (
        <BubbleGroup className="w-full max-w-md">
          <Bubble variant="muted">
            <BubbleContent>帮我推荐一些适合夜晚听的歌。</BubbleContent>
          </Bubble>
          <Bubble align="end" variant="tinted">
            <BubbleContent>已为你整理一份「晚间漫游」歌单，共 20 首。</BubbleContent>
            <BubbleReactions>👍 3</BubbleReactions>
          </Bubble>
        </BubbleGroup>
      );
    case "shadcn-marker":
      return (
        <div className="w-full max-w-md space-y-4">
          <Marker variant="separator">
            <MarkerContent>今天</MarkerContent>
          </Marker>
          <Marker variant="border">
            <MarkerIcon>
              <CheckCircle2 />
            </MarkerIcon>
            <MarkerContent>已同步 128 首喜欢的歌曲</MarkerContent>
          </Marker>
        </div>
      );
    case "shadcn-message":
      return (
        <Message className="w-full max-w-lg">
          <MessageAvatar className="size-9">
            <Bot className="size-5" />
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>Scopify 助手</MessageHeader>
            <Bubble variant="muted">
              <BubbleContent>根据你的最近播放，推荐从《十一月的萧邦》开始。</BubbleContent>
            </Bubble>
            <MessageFooter>刚刚 · 推荐已生成</MessageFooter>
          </MessageContent>
        </Message>
      );
  }
}
