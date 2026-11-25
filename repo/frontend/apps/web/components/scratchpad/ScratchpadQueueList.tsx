import { cn } from "@/lib/utils";
// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FolderPlus, ListMusic, Music2, NotebookPen, Play } from "lucide-react";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useUiStore } from "@/store/module/ui";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad } from "@/store/module/scratchpad";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { ScratchpadEmpty } from "./ScratchpadEmpty";

export function ScratchpadQueueList() {
  const { t } = useTranslation();
  const queue = usePlayerStore((s) => s.queue);
  const current = usePlayerStore((s) => s.queueIndex);
  const readOnly = usePlayerStore((s) => isPersonalFmPlaybackSource(s.playlistId));
  const actions = useScratchpadActions();
  const ref = useRef<HTMLDivElement>(null);
  const rows = useVirtualizer({
    count: queue.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 56,
    overscan: 6,
  });
  useLayoutEffect(() => {
    if (current >= 0 && ref.current) rows.scrollToIndex(current, { align: "auto" });
  }, [current, rows]);
  if (!queue.length) return <ScratchpadEmpty icon={ListMusic} title={t("scratchpad.queueEmpty")} />;
  return (
    <div className="scratchpad-table">
      <div
        ref={ref}
        className="scratchpad-list scratchpad-table-scroll"
        aria-label={t("scratchpad.tabQueue")}
        role="list"
      >
        <div style={{ position: "relative", height: rows.getTotalSize() }}>
          {rows.getVirtualItems().map((item) => {
            const index = item.index;
            const track = queue[index];
            const cover = getSizedImageUrl(track.album?.coverUrl, 96);
            const play = () => actions.playQueueTrack(track, index);
            return (
              <div
                key={item.key}
                role="listitem"
                className={cn(
                  "scratchpad-row scratchpad-table-row",
                  index === current ? "is-current" : index < current && "is-dimmed",
                )}

                style={{
                  position: "absolute",
                  top: item.start,
                  left: 0,
                  right: 0,
                  height: item.size,
                }}
              >
                <span className="scratchpad-cover" aria-hidden>
                  {cover ? (
                    <img src={cover} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <Music2 size={16} />
                  )}
                </span>
                <button
                  type="button"
                  className="scratchpad-song"
                  disabled={readOnly}
                  onClick={play}
                >
                  <span className="scratchpad-name">{track.title}</span>
                  <span className="scratchpad-meta">
                    <span className="scratchpad-film-edge">
                      {index === current ? `▶ ${t("scratchpad.nowPlaying")}` : `▸ ${index + 1}`}
                    </span>
                    {formatTrackArtists(track)}
                  </span>
                </button>
                <span className="scratchpad-row-actions">
                  {!readOnly && (
                    <button
                      type="button"
                      className="scratchpad-icon-button"
                      onClick={play}
                      title={t("scratchpad.playFromQueue")}
                      aria-label={t("scratchpad.playFromQueue")}
                    >
                      <Play />
                    </button>
                  )}
                  <button
                    type="button"
                    className="scratchpad-icon-button"
                    onClick={() =>
                      collectTracksToScratchpad([track], { label: t("scratchpad.originQueue") })
                    }
                    title={t("scratchpad.collect")}
                    aria-label={t("scratchpad.collect")}
                  >
                    <NotebookPen />
                  </button>
                  <button
                    type="button"
                    className="scratchpad-icon-button"
                    onClick={() => actions.openSaveToPlaylist([track], "queue")}
                    title={t("scratchpad.saveToPlaylist")}
                    aria-label={t("scratchpad.saveToPlaylist")}
                  >
                    <FolderPlus />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <footer className="scratchpad-footer">
        <button
          type="button"
          className="scratchpad-pill"
          onClick={() => useUiStore.getState().setIsQueueOpen(true)}
        >
          <ListMusic />
          {t("scratchpad.tabQueue")}
        </button>
      </footer>
    </div>
  );
}
