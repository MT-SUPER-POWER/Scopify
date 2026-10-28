"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useHistoryNavigationState } from "@/hooks/ui/useHistoryNavigationState";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { headerStyles } from "@/styles";
import type { ShortcutCommandId } from "@/types/shortcuts/model";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";

const NAV_BTN = cn(
  headerStyles.noDrag,
  "flex size-8 items-center justify-center rounded-full transition-all",
  "bg-surface-sunken/80 text-content-muted hover:bg-surface-elevated hover:text-content",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken/40 disabled:text-content-subtle/50",
  "disabled:hover:bg-surface-sunken/40 disabled:hover:text-content-subtle/50",
);

/**
 * 顶栏前进/后退：仅桌面端提供（Web 端使用浏览器自身的导航），
 * 无可跳转的历史时置灰禁用。快捷键默认 Alt+Shift+H / Alt+Shift+L。
 */
export function HeaderHistoryNav() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const { canGoBack, canGoForward } = useHistoryNavigationState();

  if (!runtime.isDesktop) return null;

  const items: {
    commandId: ShortcutCommandId;
    disabled: boolean;
    icon: typeof ChevronLeft;
    label: string;
    onClick: () => void;
    className?: string;
  }[] = [
    {
      commandId: "navigate-back",
      disabled: !canGoBack,
      icon: ChevronLeft,
      label: t("shortcuts.command.navigateBack"),
      onClick: () => smartRouter.back(),
    },
    {
      commandId: "navigate-forward",
      disabled: !canGoForward,
      icon: ChevronRight,
      label: t("shortcuts.command.navigateForward"),
      onClick: () => smartRouter.forward(),
      className: headerStyles.forward,
    },
  ];

  return (
    <TooltipProvider>
      {items.map(({ commandId, disabled, icon: Icon, label, onClick, className }) => (
        <Tooltip key={commandId}>
          <TooltipTrigger asChild>
            {/* 禁用的按钮不触发指针事件，外包一层以保留提示 */}
            <span className={cn(headerStyles.noDrag, "inline-flex", className)}>
              <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                className={NAV_BTN}
              >
                <Icon className="size-5" />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <ShortcutHint commandId={commandId} label={label} />
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
