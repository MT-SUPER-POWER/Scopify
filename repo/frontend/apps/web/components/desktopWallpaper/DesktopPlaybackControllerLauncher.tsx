"use client";

import { MonitorCog } from "lucide-react";
import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { useDesktopPlaybackWallpaperController } from "@/hooks/desktopWallpaper/useDesktopPlaybackWallpaperController";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export function DesktopPlaybackControllerLauncher() {
  const { t } = useI18n();
  const controller = useDesktopPlaybackWallpaperController();
  if (!runtime.isDesktop) return null;

  const openController = async () => {
    try {
      if (!(await controller.showController())) {
        toast.error(t("desktopPlaybackController.openFailed"));
      }
    } catch {
      toast.error(t("desktopPlaybackController.openFailed"));
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t("desktopPlaybackController.open")}
            className={cn(
              "flex items-center justify-center transition-colors hover:text-content",
              controller.model?.preferences.enabled && "text-brand",
            )}
            onClick={() => void openController()}
          >
            <MonitorCog className="size-4 lg:size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <ShortcutHint
            commandId="toggle-desktop-controller"
            label={t("desktopPlaybackController.open")}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
