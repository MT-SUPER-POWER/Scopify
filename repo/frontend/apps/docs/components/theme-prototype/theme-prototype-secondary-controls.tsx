"use client";

import { Sparkles } from "lucide-react";

import type { ThemePrototypeSecondaryControlsProps } from "@/types/theme-lab";

export function ThemePrototypeSecondaryControls({
  definitions,
  onTokenChange,
  tab,
  values,
}: ThemePrototypeSecondaryControlsProps) {
  const radius = definitions.find((definition) => definition.name === "--radius");

  if (tab === "other" && radius) {
    return (
      <div className="px-4 py-2">
        <details open>
          <summary className="text-muted-foreground mb-3 cursor-pointer text-[11px] font-semibold tracking-wider uppercase">
            Shape
          </summary>
          <label className="flex items-center gap-3 text-sm">
            <span className="w-20">Radius</span>
            <input
              className="bg-muted/50 h-8 min-w-0 flex-1 rounded-md border px-2 font-mono text-xs outline-none"
              value={values[radius.name] ?? ""}
              onChange={(event) => onTokenChange(radius, event.target.value)}
            />
          </label>
        </details>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground grid flex-1 place-items-center px-8 text-center text-sm">
      <div>
        <Sparkles className="mx-auto mb-3 size-5" />
        <p>{tab === "typography" ? "Typography controls" : "Theme generation"}</p>
        <p className="mt-1 text-xs">视觉位置已按 tweakcn 保留，能力将在下一阶段接入。</p>
      </div>
    </div>
  );
}
