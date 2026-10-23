"use client";

import { ListEnd, ListPlus, Shuffle, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { FoliaIconButton } from "@scopify/ui/scopify/components/folia-panel/controls";

import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useI18n } from "@/store/module/i18n";
import { usePlayerStore } from "@/store/module/player";

// The queue tab (Folia panelTab/QueueTab.tsx): a line with the number of songs and the queue's own
// button, then the queue as a list that scrolls inside itself. The list is as tall as its rows,
// seven and a half at most and lower where the window leaves less (--pn-tab-room), and fades at the
// bottom while more rows follow. A row plays its song; its actions open under the pointer and when
// the keyboard reaches them, so a long title keeps the whole row until then.

const ROW_PX = 48;
const HEAD_PX = 36;
const LIST_MAX_PX = 7.5 * ROW_PX;
const FADE = "linear-gradient(#000 calc(100% - 32px), transparent)";

export function FoliaPanelQueue() {
  const { t } = useI18n();
  const currentSong = usePlayerStore((state) => state.currentSongDetail);
  const queue = usePlayerStore((state) => state.queue);
  const playbackSourceId = usePlayerStore((state) => state.playlistId);
  const isPersonalFm = isPersonalFmPlaybackSource(playbackSourceId);
  const listRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const currentIndex = queue.findIndex((song) => song.id === currentSong?.id);

  // Opens on the playing song, two rows below the top.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (currentIndex > 0) list.scrollTop = Math.max(0, (currentIndex - 2) * ROW_PX);
    setMore(list.scrollHeight - list.scrollTop - list.clientHeight > 2);
    // Only when the tab opens or the queue is replaced; following every song change would pull the
    // list away from where the listener scrolled it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  return (
    <div className="select-none">
      <div className="flex items-center gap-0.5 pb-1 pl-1" style={{ height: HEAD_PX }}>
        <span className="min-w-0 flex-1 truncate text-[13px] leading-5 font-semibold text-[color:var(--st-t2)]">
          {isPersonalFm ? t("personalFm.queue.dynamic") : t("folia.queue.title")}
          <span className="ml-1.5 font-normal text-[color:var(--st-t3)]">{queue.length}</span>
        </span>
        {!isPersonalFm ? (
          <FoliaIconButton
            size="s"
            label={t("folia.queue.shuffle")}
            onClick={() => usePlayerStore.getState().toggleShuffle()}
          >
            <Shuffle size={15} />
          </FoliaIconButton>
        ) : null}
      </div>

      {queue.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-[color:var(--st-t3)]">
          {t("folia.queue.empty")}
        </div>
      ) : (
        <div
          ref={listRef}
          role="list"
          onScroll={(event) => {
            const list = event.currentTarget;
            setMore(list.scrollHeight - list.scrollTop - list.clientHeight > 2);
          }}
          className="st-scroll overflow-y-auto overscroll-contain"
          style={{
            maxHeight: `min(${LIST_MAX_PX}px, var(--pn-tab-room, ${LIST_MAX_PX}px) - ${HEAD_PX}px)`,
            ...(more ? { maskImage: FADE, WebkitMaskImage: FADE } : {}),
          }}
        >
          {queue.map((song, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={`${song.id}-${index}`}
                role="listitem"
                onClick={() => void usePlayerStore.getState().playQueueIndex(index)}
                className={`st-t-fast group relative flex cursor-pointer items-center rounded-lg pr-1.5 pl-3 transition-colors ${isActive ? "bg-[var(--st-fill)]" : "focus-within:bg-[var(--st-fill)] hover:bg-[var(--st-fill)]"}`}
                style={{ height: ROW_PX }}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-3.5 left-0 w-[3px] rounded-r-sm bg-[var(--st-accent)]"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-[13px] leading-[19px] ${isActive ? "font-semibold" : ""}`}
                  >
                    {song.name}
                  </div>
                  <div className="truncate text-xs leading-[17px] text-[color:var(--st-t3)]">
                    {song.ar?.map((artist) => artist.name).join(", ")}
                  </div>
                </div>
                {!isPersonalFm ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="st-t-fast flex w-0 shrink-0 items-center gap-0.5 overflow-hidden opacity-0 transition-opacity group-focus-within:ml-2 group-focus-within:w-auto group-focus-within:opacity-100 group-hover:ml-2 group-hover:w-auto group-hover:opacity-100"
                  >
                    <FoliaIconButton
                      size="s"
                      label={t("folia.queue.playNext")}
                      onClick={() => usePlayerStore.getState().moveQueueItemToNext(index)}
                    >
                      <ListPlus size={15} />
                    </FoliaIconButton>
                    <FoliaIconButton
                      size="s"
                      label={t("folia.queue.moveToEnd")}
                      onClick={() =>
                        usePlayerStore.getState().moveQueueItem(index, queue.length - 1)
                      }
                    >
                      <ListEnd size={15} />
                    </FoliaIconButton>
                    <FoliaIconButton
                      size="s"
                      label={t("folia.queue.remove")}
                      onClick={() => usePlayerStore.getState().removeQueueItem(index)}
                    >
                      <Trash2 size={15} />
                    </FoliaIconButton>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
