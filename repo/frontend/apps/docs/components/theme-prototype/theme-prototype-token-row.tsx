"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";

import type { ThemePrototypeTokenRowProps } from "@/types/theme-lab";

export function ThemePrototypeTokenRow({
  definition,
  onChange,
  value,
}: ThemePrototypeTokenRowProps) {
  const valid = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value);
  const color = valid ? value : "#000000";
  const pickerColor = valid ? value.slice(0, 7) : "#000000";
  const randomize = () => {
    const next = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0");
    onChange(`#${next}`);
  };

  return (
    <div className="group hover:bg-muted/50 -mx-1 flex items-center gap-2.5 rounded-lg px-2 py-0.5 transition-colors">
      <label
        className="relative flex size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm"
        style={{ background: color }}
      >
        <span className="sr-only">选择 {definition.label}</span>
        <input
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          type="color"
          value={pickerColor}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
      </label>
      <span className="min-w-20 shrink-0 text-[13px] font-medium">{definition.label}</span>
      <div className="ml-auto flex min-w-0 flex-1 items-center gap-1">
        <input
          aria-invalid={!valid}
          aria-label={`${definition.group} ${definition.label}`}
          className="bg-muted/50 text-muted-foreground focus:border-ring focus:text-foreground aria-invalid:border-destructive h-7 min-w-0 flex-1 rounded-md border px-2 font-mono text-xs outline-none"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
        />
        <Button
          className="size-7 shrink-0"
          size="icon"
          type="button"
          variant="ghost"
          aria-label={`随机生成 ${definition.label}`}
          onClick={randomize}
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
