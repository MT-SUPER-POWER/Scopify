"use client";

import { ListMusic, LocateFixed } from "lucide-react";
import { useRef } from "react";

import { PlayerQueueList } from "@/components/player/PlayerQueueList";
import { ShortcutHint } from "@/components/shortcuts/ShortcutHint";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@scopify/ui/shadcn/components/tooltip";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import { useUiStore } from "@/store/module/ui";
import type { PlayerQueueListHandle } from "@/types/components/player";

export const QueuePopover = () => {
  const { t } = useI18n();
  const queue = usePlayerStore((state) => state.queue);
  const open = useUiStore((state) => state.isQueueOpen);
  const setOpen = useUiStore((state) => state.setIsQueueOpen);
  const queueListRef = useRef<PlayerQueueListHandle>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={t("queue.triggerTitle")}
                className="flex items-center justify-center text-content-muted transition-colors hover:text-content"
              >
                <ListMusic className="size-5" />
              </button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <ShortcutHint commandId="toggle-queue" label={t("queue.triggerTitle")} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        align="end"
        className="w-96 border border-content/10 bg-surface-elevated p-0 text-content shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-content/10 bg-surface-elevated/90 p-4 backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-bold">{t("queue.title")}</h3>
            <p className="text-xs text-content-muted">
              {t("queue.totalSongs", { count: queue.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => queueListRef.current?.scrollToCurrent()}
            className="rounded-full p-2 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
            title={t("queue.locateCurrent")}
          >
            <LocateFixed className="size-4" />
          </button>
        </div>
        <PlayerQueueList ref={queueListRef} isOpen={open} />
      </PopoverContent>
    </Popover>
  );
};

export default QueuePopover;
