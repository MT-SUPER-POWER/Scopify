"use client";

import {
  Code2,
  Download,
  Moon,
  MoreVertical,
  Redo2,
  RotateCcw,
  Save,
  Sun,
  Undo2,
  Upload,
} from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Separator } from "@scopify/ui/shadcn/components/separator";

import type { ThemePrototypeActionBarProps } from "@/types/theme-lab";

export function ThemePrototypeActionBar({
  mode,
  onExport,
  onModeChange,
  onReset,
  onSave,
}: ThemePrototypeActionBarProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-end gap-1 overflow-x-auto border-b px-4">
      <Button size="icon" variant="ghost" aria-label="更多主题操作">
        <MoreVertical />
      </Button>
      <Separator className="mx-1 h-8" orientation="vertical" />
      <div className="bg-muted flex rounded-full p-0.5">
        <Button
          className="size-7 rounded-full"
          size="icon"
          variant={mode === "light" ? "secondary" : "ghost"}
          aria-label="浅色模式"
          onClick={() => onModeChange("light")}
        >
          <Sun />
        </Button>
        <Button
          className="size-7 rounded-full"
          size="icon"
          variant={mode === "dark" ? "secondary" : "ghost"}
          aria-label="深色模式"
          onClick={() => onModeChange("dark")}
        >
          <Moon />
        </Button>
      </div>
      <Separator className="mx-1 h-8" orientation="vertical" />
      <Button disabled size="icon" variant="ghost" aria-label="撤销">
        <Undo2 />
      </Button>
      <Button disabled size="icon" variant="ghost" aria-label="重做">
        <Redo2 />
      </Button>
      <Separator className="mx-1 h-8" orientation="vertical" />
      <Button size="sm" variant="ghost" onClick={onReset}>
        <RotateCcw /> Reset
      </Button>
      <Button disabled size="sm" variant="ghost">
        <Upload /> Import
      </Button>
      <Separator className="mx-1 h-8" orientation="vertical" />
      <Button size="sm" variant="ghost" onClick={onExport}>
        <Download /> Export
      </Button>
      <Button size="sm" variant="ghost" onClick={onSave}>
        <Save /> Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onExport}>
        <Code2 /> Code
      </Button>
    </div>
  );
}
