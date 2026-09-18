"use client";

import { HexColorInput, HexColorPicker } from "react-colorful";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@scopify/ui/shadcn/components/popover";
import type { ThemeColorControlProps } from "@/types/appearance-theme-editor";
import { SettingRow } from "./SettingsUI";

export function ThemeColorControl({ label, value, onChange }: ThemeColorControlProps) {
  return (
    <SettingRow
      label={label}
      control={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={label}>
              <span
                className="size-4 rounded-sm border border-border"
                style={{ backgroundColor: value }}
              />
              <span className="font-mono text-xs">{value.toUpperCase()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-3">
            <p className="text-sm font-medium">{label}</p>
            <HexColorPicker color={value} onChange={onChange} style={{ width: "100%" }} />
            <HexColorInput
              aria-label={`${label} HEX`}
              color={value}
              onChange={onChange}
              prefixed
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </PopoverContent>
        </Popover>
      }
    />
  );
}
