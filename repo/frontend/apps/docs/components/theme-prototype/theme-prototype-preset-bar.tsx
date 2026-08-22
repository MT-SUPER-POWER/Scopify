"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@scopify/ui/shadcn/components/popover";

import type { ThemePrototypePresetBarProps } from "@/types/theme-lab";

const SWATCH_TOKENS = ["--primary", "--accent", "--secondary", "--border"] as const;

export function ThemePrototypePresetBar({
  mode,
  onThemeIdChange,
  themeId,
  values,
}: ThemePrototypePresetBarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center border-b">
      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-full w-full justify-between rounded-none px-4" variant="ghost">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex gap-0.5">
                {SWATCH_TOKENS.map((token) => (
                  <span
                    className="size-3 rounded-sm border"
                    key={token}
                    style={{ background: values[token] }}
                  />
                ))}
              </span>
              <span className="truncate text-sm font-medium capitalize">{themeId}</span>
              <span className="text-muted-foreground rounded-full border px-1.5 py-0.5 text-[9px] uppercase">
                {mode}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-3 p-4">
          <div>
            <p className="text-sm font-medium">Theme ID</p>
            <p className="text-muted-foreground mt-1 text-xs">
              导出时会用作 data-theme 名称和 CSS 文件名。
            </p>
          </div>
          <Input
            aria-label="主题 ID"
            className="font-mono text-xs"
            value={themeId}
            onChange={(event) => onThemeIdChange(event.target.value)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
