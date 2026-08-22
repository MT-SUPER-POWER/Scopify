"use client";

import { ListMusic, Mic2, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@scopify/ui/shadcn/components/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@scopify/ui/shadcn/components/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@scopify/ui/shadcn/components/dropdown-menu";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnOverlayMenuPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-command":
      return (
        <Command className="w-full max-w-md rounded-lg border shadow-sm">
          <CommandInput placeholder="搜索命令或音乐" />
          <CommandList>
            <CommandEmpty>没有匹配结果</CommandEmpty>
            <CommandGroup heading="快捷操作">
              <CommandItem>
                <Search /> 搜索音乐 <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ListMusic /> 打开播放队列
              </CommandItem>
              <CommandItem>
                <Mic2 /> 开启桌面歌词
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
    case "shadcn-context-menu":
      return (
        <ContextMenu>
          <ContextMenuTrigger className="bg-muted/40 flex h-40 w-full max-w-sm items-center justify-center rounded-xl border border-dashed text-sm">
            在此区域右键
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>立即播放</ContextMenuItem>
            <ContextMenuItem>
              添加到队列 <ContextMenuShortcut>⌘↵</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>查看歌曲详情</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    case "shadcn-dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal /> 更多操作
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>歌曲操作</DropdownMenuLabel>
            <DropdownMenuItem>下一首播放</DropdownMenuItem>
            <DropdownMenuItem>收藏到歌单</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">从队列移除</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
  }
}
