import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ArrowUpRight, MessageSquareQuote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScratchpadEmpty } from "./ScratchpadEmpty";
import ScratchpadCommentsHead from "./ScratchpadCommentsHead";
import ScratchpadCommentList from "./ScratchpadCommentList";
import ScratchpadCommentComposer from "./ScratchpadCommentComposer";
import { usePlayerStore } from "@/store/module/player";
import { useScratchpadStore } from "@/store/module/scratchpad";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { getRecentMomentRecords } from "@/lib/scratchpad/songNotesModel";

export function NowPlayingMomentsSubView() {
  const { t } = useTranslation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const viewingTrack = useScratchpadStore((s) => s.viewingMomentTrack);
  const setViewingTrack = useScratchpadStore((s) => s.setViewingMomentTrack);
  const records = useScratchpadStore((s) => s.momentsByKey);
  const tags = useScratchpadStore((s) => s.tags);
  const sort = useScratchpadStore((s) => s.momentSort);
  const setSort = useScratchpadStore((s) => s.setMomentSort);
  const commands = usePlaybackCommands();
  const actions = useScratchpadActions();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [written, setWritten] = useState<string | null>(null);
  const recentRecords = useMemo(() => getRecentMomentRecords(records, 12), [records]);
  const tagNames = useMemo(() => new Map(tags.map((tag) => [tag.key, tag])), [tags]);
  const targetTrack = viewingTrack ?? currentTrack;
  const targetKey = targetTrack && playerTrackKey(targetTrack);
  if (!targetTrack || !targetKey) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {recentRecords.length === 0 ? (
          <ScratchpadEmpty
            icon={MessageSquareQuote}
            title={t("scratchpad.momentsEmptyTitle")}
            description={t("scratchpad.momentsEmptyDesc")}
          />
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="scratchpad-comments-recent">
              <p className="pb-2 text-xs font-bold text-content-muted">
                {t("scratchpad.momentsRecent")}
              </p>
              {recentRecords.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setViewingTrack(item.track)}
                  className="scratchpad-comments-recent-item"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{item.track.title}</p>
                    <p className="mt-0.5 truncate text-xs text-content-muted">
                      {formatTrackArtists(item.track)} ·{" "}
                      {t("scratchpad.momentsCountSummary", {
                        comments: item.comments.length,
                        tags: item.tags.length,
                      })}
                    </p>
                  </div>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-brand" />
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  const record = records[targetKey];
  const isPlaying = !!currentTrack && playerTrackKey(currentTrack) === targetKey;
  const seek = (at: number) => {
    void commands.seek(at * 1000);
  };
  return (
    <div className="scratchpad-comments">
      <div className="scratchpad-comments-scroll-body">
        <ScratchpadCommentsHead
          key={targetKey}
          song={targetTrack}
          songKey={targetKey}
          tags={record?.tags ?? []}
          tagNames={tagNames}
          comments={record?.comments ?? []}
          isPlaying={isPlaying}
          duration={targetTrack.durationMs / 1000}
          onSeek={seek}
          onPlay={() => actions.playNow(targetTrack)}
          onBackToPlaying={
            viewingTrack && !isPlaying && currentTrack ? () => setViewingTrack(null) : undefined
          }
        />
        <div
          className="scratchpad-comments-sort"
          role="group"
          aria-label={t("scratchpad.foliaMoment.sortLabel")}
        >
          {(["written", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={sort === mode}
              className={cn("scratchpad-comments-sort-option", sort === mode && "is-active")}

              onClick={() => setSort(mode)}
            >
              {t(mode === "written" ? "scratchpad.sortWritten" : "scratchpad.sortTimeline")}
            </button>
          ))}
          <span className="scratchpad-comments-sort-count">
            {t("scratchpad.momentsCommentCount", { count: record?.comments.length ?? 0 })}
          </span>
        </div>
        <ScratchpadCommentList
          key={targetKey}
          trackKey={targetKey}
          comments={record?.comments ?? []}
          sort={sort}
          canSeek={isPlaying}
          onSeek={seek}
          scrollToId={written}
        />
      </div>
      <ScratchpadCommentComposer
        key={targetKey}
        song={targetTrack}
        canPin={isPlaying}
        draft={drafts[targetKey] ?? ""}
        setDraft={(text) => setDrafts((all) => ({ ...all, [targetKey]: text }))}
        onWritten={setWritten}
      />
    </div>
  );
}
