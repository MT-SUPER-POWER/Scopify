"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import type { TrayMenuButtonProps } from "@/types/desktop/trayComponents";

/** 托盘面板里“图标 + 文案”的菜单行，覆盖 Button 的默认样式让它更像菜单项。 */
export function TrayMenuButton({ icon: Icon, label, onClick }: TrayMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      className="h-9 w-full justify-start gap-0 rounded-md px-3 font-normal text-content-muted transition-colors hover:bg-surface-elevated hover:text-content"
      onClick={onClick}
    >
      <Icon className="mr-2 size-4" />
      <span>{label}</span>
    </Button>
  );
}
