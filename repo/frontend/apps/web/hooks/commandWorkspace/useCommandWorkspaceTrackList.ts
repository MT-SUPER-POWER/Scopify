"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { loadCommandWorkspaceTrackList } from "@/lib/commandWorkspace/trackList";
import type {
  CommandWorkspaceSearchItem,
  CommandWorkspaceTrackList,
} from "@/types/commandWorkspace";

export function useCommandWorkspaceTrackList() {
  const [trackList, setTrackList] = useState<CommandWorkspaceTrackList | null>(null);
  const [isLoadingTrackList, setIsLoadingTrackList] = useState(false);

  const openTrackList = useCallback(async (item: CommandWorkspaceSearchItem) => {
    setIsLoadingTrackList(true);
    try {
      const nextTrackList = await loadCommandWorkspaceTrackList(item);
      if (nextTrackList.tracks.length === 0) {
        toast.error("没有可播放曲目。");
        return null;
      }
      setTrackList(nextTrackList);
      return nextTrackList;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "曲目加载失败，请稍后重试。");
      return null;
    } finally {
      setIsLoadingTrackList(false);
    }
  }, []);

  return { isLoadingTrackList, openTrackList, setTrackList, trackList };
}
