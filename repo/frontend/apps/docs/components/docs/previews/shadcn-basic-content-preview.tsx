"use client";

import { ArrowLeft, Disc3, ListMusic, Music2, Play } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@scopify/ui/shadcn/components/avatar";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@scopify/ui/shadcn/components/card";
import { DirectionProvider } from "@scopify/ui/shadcn/components/direction";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@scopify/ui/shadcn/components/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@scopify/ui/shadcn/components/item";
import { Separator } from "@scopify/ui/shadcn/components/separator";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnBasicContentPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-avatar":
      return (
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>SC</AvatarFallback>
            <AvatarBadge className="bg-emerald-500" />
          </Avatar>
          <div>
            <p className="font-medium">Scopify Listener</p>
            <p className="text-muted-foreground text-sm">正在播放音乐</p>
          </div>
        </div>
      );
    case "shadcn-card":
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>每日推荐</CardTitle>
            <CardDescription>根据你的收听偏好生成</CardDescription>
            <CardAction>
              <Button size="icon-sm" variant="ghost" aria-label="播放">
                <Play />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">30 首歌曲 · 今天更新</CardContent>
        </Card>
      );
    case "shadcn-empty":
      return (
        <Empty className="w-full max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListMusic />
            </EmptyMedia>
            <EmptyTitle>播放队列为空</EmptyTitle>
            <EmptyDescription>从歌曲或歌单中添加音乐开始播放。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">浏览推荐</Button>
          </EmptyContent>
        </Empty>
      );
    case "shadcn-item":
      return (
        <Item variant="outline" className="w-full max-w-md">
          <ItemMedia variant="icon">
            <Music2 />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>夜曲</ItemTitle>
            <ItemDescription>周杰伦 · 十一月的萧邦</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="icon-sm" variant="ghost" aria-label="播放夜曲">
              <Play />
            </Button>
          </ItemActions>
        </Item>
      );
    case "shadcn-separator":
      return (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <p className="font-medium">本周精选</p>
            <p className="text-muted-foreground text-sm">为你挑选的新音乐</p>
          </div>
          <Separator />
          <div className="flex h-5 items-center gap-4 text-sm">
            <span>歌曲</span>
            <Separator orientation="vertical" />
            <span>专辑</span>
            <Separator orientation="vertical" />
            <span>艺人</span>
          </div>
        </div>
      );
    case "shadcn-direction":
      return (
        <DirectionProvider dir="rtl">
          <div dir="rtl" className="bg-muted w-full max-w-sm rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <Disc3 />
              从右向左的内容
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              方向上下文会传递给支持 RTL 的组件。
            </p>
            <ArrowLeft className="mt-3" />
          </div>
        </DirectionProvider>
      );
  }
}
