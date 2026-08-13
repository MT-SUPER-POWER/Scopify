"use client";

import { Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { DesktopPlaybackWallpaperModel } from "@mt-super-power/desktop-contract";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getDesktopPlaybackWallpaperToggleUpdate } from "@/lib/desktopPlaybackWallpaper/toggle";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

export function DesktopPlaybackWallpaperToggle() {
  const { t } = useI18n();
  const [model, setModel] = useState<DesktopPlaybackWallpaperModel | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!runtime.isDesktop) return;
    let disposed = false;
    void runtime.desktopPlaybackWallpaper.getModel().then((nextModel) => {
      if (!disposed) setModel(nextModel);
    });
    const unsubscribe = runtime.desktopPlaybackWallpaper.onModelChanged((nextModel) => {
      if (!disposed) setModel(nextModel);
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  if (!runtime.isDesktop) return null;
  const enabled = model?.preferences.enabled ?? false;
  const label = t(enabled ? "ui.disableDesktopMusicWallpaper" : "ui.enableDesktopMusicWallpaper");

  const toggle = async () => {
    if (!model || isPending) return;
    setIsPending(true);
    try {
      setModel(
        await runtime.desktopPlaybackWallpaper.configure(
          getDesktopPlaybackWallpaperToggleUpdate(model.preferences),
        ),
      );
    } catch {
      toast.error(t("ui.desktopMusicWallpaperFailed"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            disabled={!model || isPending}
            onClick={() => void toggle()}
            className={cn(
              "flex items-center justify-center transition-colors disabled:opacity-35",
              "hover:text-content",
              enabled && "text-brand",
              (isPending || model?.status.state === "starting") && "animate-pulse",
            )}
          >
            <Monitor className="size-4 lg:size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
