"use client";

import { ListEnd, ListPlus, Shuffle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { usePlayerStore } from "@/store/module/player";

export function FoliaPanelQueue() {
  const { t } = useTranslation();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const queue = usePlayerStore((state) => state.queue);

  return (
    <div className="flex max-h-80 flex-col select-none">
      <div className="flex shrink-0 items-center justify-between px-2 pb-2">
        <span className="text-xs font-medium opacity-60">
          {t("queue.title")} ({queue.length})
        </span>
        <button
          type="button"
          title={String(t("queue.shuffle"))}
          onClick={() => usePlayerStore.getState().toggleShuffle()}
          className="rounded-md p-1.5 opacity-60 hover:bg-white/10 hover:opacity-100"
        >
          <Shuffle size={14} />
        </button>
      </div>
      <div className="visualizer-overlay-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {queue.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs opacity-40">
            {t("queue.empty")}
          </div>
        ) : (
          queue.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              onClick={() => void usePlayerStore.getState().playQueueIndex(index)}
              className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                currentSong?.id === song.id ? "bg-white/20" : "hover:bg-white/5"
              }`}
            >
              <span
                className={`h-6 w-1 rounded-full ${currentSong?.id === song.id ? "bg-white" : "bg-transparent"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{song.name}</span>
                <span className="block truncate text-[10px] opacity-40">
                  {song.ar?.map((artist) => artist.name).join(", ")}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <QueueAction
                  title={String(t("queue.playNext"))}
                  onClick={() => usePlayerStore.getState().moveQueueItemToNext(index)}
                >
                  <ListPlus size={13} />
                </QueueAction>
                <QueueAction
                  title={String(t("queue.moveToEnd"))}
                  onClick={() => usePlayerStore.getState().moveQueueItem(index, queue.length - 1)}
                >
                  <ListEnd size={13} />
                </QueueAction>
                <QueueAction
                  title={String(t("queue.remove"))}
                  onClick={() => usePlayerStore.getState().removeQueueItem(index)}
                >
                  <Trash2 size={13} />
                </QueueAction>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QueueAction({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="rounded-md p-1.5 hover:bg-white/10"
    >
      {children}
    </button>
  );
}
