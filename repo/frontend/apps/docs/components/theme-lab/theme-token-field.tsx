"use client";

import { Input } from "@scopify/ui/shadcn/components/input";
import { Label } from "@scopify/ui/shadcn/components/label";

import type { ThemeTokenDefinition } from "@/types/theme-lab";

interface ThemeTokenFieldProps {
  definition: ThemeTokenDefinition;
  onChange: (value: string) => void;
  value: string;
}

export function ThemeTokenField({ definition, onChange, value }: ThemeTokenFieldProps) {
  const isColor = definition.kind === "color";
  const isValid =
    !isColor || typeof CSS === "undefined" || value.length === 0 || CSS.supports("color", value);

  return (
    <div className="bg-card/60 grid gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={definition.name} className="text-xs font-medium">
          {definition.label}
        </Label>
        <code className="text-muted-foreground truncate text-[10px]">{definition.name}</code>
      </div>
      <div className="flex items-center gap-2">
        {isColor ? (
          <span
            aria-hidden="true"
            className="size-8 shrink-0 rounded-md border shadow-sm"
            style={{ background: isValid ? value : "transparent" }}
          />
        ) : null}
        <Input
          id={definition.name}
          aria-invalid={!isValid}
          className="h-8 min-w-0 font-mono text-xs"
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          value={value}
        />
      </div>
      {!isValid ? <span className="text-destructive text-[11px]">当前值不是有效颜色。</span> : null}
    </div>
  );
}
