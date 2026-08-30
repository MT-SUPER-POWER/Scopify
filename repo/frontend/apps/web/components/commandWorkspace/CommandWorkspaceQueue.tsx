"use client";

import { ChevronDown, ChevronUp, ListPlus, Play, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store";

export function CommandWorkspaceQueue() {
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
  const moveQueueItemToNext = usePlayerStore((state) => state.moveQueueItemToNext);
  const playQueueIndex = usePlayerStore((state) => state.playQueueIndex);
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const removeQueueItem = usePlayerStore((state) => state.removeQueueItem);

  if (queue.length === 0) {
    return <p className="px-5 py-12 text-center text-sm text-zinc-500">播放队列为空。</p>;
  }

  return (
    <ScrollArea className="h-[min(58vh,36rem)]">
      <div className="py-2">
        {queue.map((track, index) => (
          <div
            key={`${track.voiceId ?? "song"}-${track.id}-${index}`}
            className={
              index === queueIndex
                ? "group flex items-center gap-3 bg-white/10 px-5 py-2.5"
                : "group flex items-center gap-3 px-5 py-2.5 hover:bg-white/6"
            }
          >
            <button
              type="button"
              onClick={() => void playQueueIndex(index)}
              className="w-5 text-xs text-zinc-500 tabular-nums"
            >
              {index === queueIndex ? (
                <Play className="size-3.5 fill-white text-white" />
              ) : (
                index + 1
              )}
            </button>
            <button
              type="button"
              onClick={() => void playQueueIndex(index)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-medium text-white">{track.name}</span>
              <span className="block truncate text-xs text-zinc-400">
                {track.ar.map((artist) => artist.name).join(" / ")}
              </span>
            </button>
            <span className="text-xs text-zinc-500 tabular-nums">{formatDuration(track.dt)}</span>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => moveQueueItem(index, index - 1)}
                disabled={index === 0}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="上移"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveQueueItem(index, index + 1)}
                disabled={index === queue.length - 1}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                title="下移"
              >
                <ChevronDown className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveQueueItemToNext(index)}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                title="下一首播放"
              >
                <ListPlus className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeQueueItem(index)}
                className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-red-300"
                title="移除"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
