"use client";

import { Info, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback } from "@scopify/ui/shadcn/components/avatar";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@scopify/ui/shadcn/components/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@scopify/ui/shadcn/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnOverlayFlyoutPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-hover-card":
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@周杰伦</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>周</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">周杰伦</p>
                <p className="text-muted-foreground text-sm">华语流行音乐创作歌手</p>
                <p className="text-muted-foreground text-xs">热门歌曲 50 首</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    case "shadcn-popover":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Info /> 音质说明
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>无损音质</PopoverTitle>
              <PopoverDescription>最高 24 bit / 192 kHz，播放时将消耗更多流量。</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      );
    case "shadcn-tooltip":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">
                <Sparkles /> 悬停查看
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>由 Radix 提供无障碍交互</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
  }
}
