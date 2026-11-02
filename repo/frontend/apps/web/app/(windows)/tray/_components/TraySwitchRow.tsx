"use client";

import { Switch } from "@/components/ui/switch";
import type { TraySwitchRowProps } from "@/types/desktop/tray";

/** 托盘面板里“图标 + 文案 + 开关”的整行，整行可点。 */
export function TraySwitchRow({
  icon: Icon,
  label,
  checked,
  disabled,
  onToggle,
}: TraySwitchRowProps) {
  return (
    <div
      className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md px-3 font-normal text-content-muted transition-colors hover:bg-surface-elevated hover:text-content"
      onClick={() => {
        if (!disabled) onToggle();
      }}
    >
      <div className="mr-2 flex min-w-0 flex-1 items-center">
        <Icon className="mr-2 size-4" />
        <span className="truncate">{label}</span>
      </div>
      <Switch
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
