"use client";

import { LocateFixed } from "lucide-react";
import { useRef } from "react";
import { PlayerQueueList } from "@/components/player/PlayerQueueList";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";

import type { PlayerQueueListHandle } from "@/types/player/components";

/** 面板的队列视图：复用播放栏浮层的可拖拽排序列表，高度随面板伸展。 */
export function NowPlayingQueueView() {
  const { t } = useTranslation();
  const queueLength = usePlayerStore((s) => s.queue.length);
  const queueListRef = useRef<PlayerQueueListHandle>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1">
        <p className="text-xs text-content-muted">
          {t("queue.totalSongs", { count: queueLength })}
        </p>
        <button
          type="button"
          onClick={() => queueListRef.current?.scrollToCurrent()}
          title={t("queue.locateCurrent")}
          aria-label={t("queue.locateCurrent")}
          className="rounded-full p-1.5 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
        >
          <LocateFixed className="size-4" />
        </button>
      </div>
      <PlayerQueueList ref={queueListRef} isOpen className="h-auto min-h-0 flex-1" />
    </div>
  );
}
