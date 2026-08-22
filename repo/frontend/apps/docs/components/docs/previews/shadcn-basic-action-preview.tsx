"use client";

import { Bell, MoreHorizontal } from "lucide-react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { ButtonGroup, ButtonGroupSeparator } from "@scopify/ui/shadcn/components/button-group";
import { Kbd, KbdGroup } from "@scopify/ui/shadcn/components/kbd";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnBasicActionPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-button":
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button>默认按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="outline">描边按钮</Button>
          <Button variant="ghost">幽灵按钮</Button>
          <Button size="icon" aria-label="通知">
            <Bell />
          </Button>
        </div>
      );
    case "shadcn-badge":
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      );
    case "shadcn-button-group":
      return (
        <ButtonGroup>
          <Button variant="outline">上一首</Button>
          <Button>播放</Button>
          <ButtonGroupSeparator />
          <Button variant="outline" size="icon" aria-label="更多操作">
            <MoreHorizontal />
          </Button>
        </ButtonGroup>
      );
    case "shadcn-kbd":
      return (
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          打开搜索
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <span>+</span>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
      );
  }
}
