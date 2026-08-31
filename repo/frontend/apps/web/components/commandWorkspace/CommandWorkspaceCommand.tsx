"use client";

import { ChevronLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { CommandWorkspaceHelp } from "@/components/commandWorkspace/CommandWorkspaceHelp";
import { CommandWorkspaceNowPlaying } from "@/components/commandWorkspace/CommandWorkspaceNowPlaying";
import { CommandWorkspaceQueue } from "@/components/commandWorkspace/CommandWorkspaceQueue";
import { CommandWorkspaceRoot } from "@/components/commandWorkspace/CommandWorkspaceRoot";
import { CommandWorkspaceSearch } from "@/components/commandWorkspace/CommandWorkspaceSearch";
import { CommandWorkspaceSettings } from "@/components/commandWorkspace/CommandWorkspaceSettings";
import { CommandWorkspaceTrackList } from "@/components/commandWorkspace/CommandWorkspaceTrackList";
import { useCommandWorkspacePlayback } from "@/hooks/commandWorkspace/useCommandWorkspacePlayback";
import { useCommandWorkspaceNavigation } from "@/hooks/commandWorkspace/useCommandWorkspaceNavigation";
import { useCommandWorkspaceTrackList } from "@/hooks/commandWorkspace/useCommandWorkspaceTrackList";
import type {
  CommandWorkspaceCommandProps,
  CommandWorkspacePage,
  CommandWorkspaceSearchItem,
} from "@/types/commandWorkspace";

export function CommandWorkspaceCommand({ onClose, onLeaveCommand }: CommandWorkspaceCommandProps) {
  const [page, setPage] = useState<CommandWorkspacePage>("root");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { appendTracks, insertTracksNext, playTracks } = useCommandWorkspacePlayback();
  const { isLoadingTrackList, openTrackList, setTrackList, trackList } =
    useCommandWorkspaceTrackList();

  const returnToRoot = useCallback(() => {
    setTrackList(null);
    setPage("root");
  }, [setTrackList]);

  const goBack = useCallback(() => {
    if (page === "root") {
      onClose();
      return;
    }
    if (page === "track-list") {
      setTrackList(null);
      setPage("search");
      return;
    }
    returnToRoot();
  }, [onClose, page, returnToRoot, setTrackList]);

  useCommandWorkspaceNavigation({
    onBack: goBack,
    onRoot: returnToRoot,
    onToggleHelp: () => setIsHelpOpen((isOpen) => !isOpen),
  });

  const handleOpenTrackList = async (item: CommandWorkspaceSearchItem) => {
    const nextTrackList = await openTrackList(item);
    if (nextTrackList) setPage("track-list");
  };

  return (
    <>
      {page !== "root" ? (
        <header className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
          <button
            type="button"
            onClick={goBack}
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="返回"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-white">
            {getPageLabel(page, trackList?.title)}
          </span>
          {isLoadingTrackList ? (
            <span className="ml-auto text-xs text-zinc-500">正在加载曲目…</span>
          ) : null}
        </header>
      ) : null}
      {page === "root" ? (
        <CommandWorkspaceRoot
          onClose={onClose}
          onLeaveCommand={onLeaveCommand}
          onOpenPage={setPage}
        />
      ) : null}
      {page === "search" ? <CommandWorkspaceSearch onOpenTrackList={handleOpenTrackList} /> : null}
      {page === "queue" ? <CommandWorkspaceQueue onClose={onClose} /> : null}
      {page === "now-playing" ? <CommandWorkspaceNowPlaying onClose={onClose} /> : null}
      {page === "settings" ? <CommandWorkspaceSettings onClose={onClose} /> : null}
      {page === "track-list" && trackList ? (
        <CommandWorkspaceTrackList
          trackList={trackList}
          onPlay={(index) => void playTracks(trackList.tracks, index)}
          onAppend={(track) => appendTracks([track])}
          onInsertNext={(track) => insertTracksNext([track])}
        />
      ) : null}
      {isHelpOpen ? <CommandWorkspaceHelp page={page} /> : null}
    </>
  );
}

function getPageLabel(page: CommandWorkspacePage, trackListTitle?: string) {
  if (page === "search") return "搜索";
  if (page === "queue") return "播放队列";
  if (page === "now-playing") return "正在播放";
  if (page === "settings") return "设置";
  if (page === "track-list") return trackListTitle ?? "曲目";
  return "命令";
}
