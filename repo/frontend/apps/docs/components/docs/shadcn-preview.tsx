"use client";

import { useState } from "react";
import { Bell, Sparkles } from "lucide-react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { Slider } from "@scopify/ui/shadcn/components/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

import type { ShadcnPreviewName } from "@/types/component-docs";

export function ShadcnPreview({ name }: { name: ShadcnPreviewName }) {
  const [sliderValue, setSliderValue] = useState([42]);

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
    case "shadcn-slider":
      return (
        <div className="w-full max-w-sm space-y-4">
          <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
          <p className="text-muted-foreground text-center text-sm tabular-nums">
            当前值：{sliderValue[0]}
          </p>
        </div>
      );
    case "shadcn-skeleton":
      return (
        <div className="flex w-full max-w-sm items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
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
