"use client";

import { useMemo, useRef, useState } from "react";
import {
  getCommandWorkspaceCategory,
  getCommandWorkspaceSearchItems,
  buildCommandWorkspaceSearchHref,
} from "@/lib/commandWorkspace/search";
import { toCommandWorkspaceSongDetail } from "@/lib/commandWorkspace/trackList";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useCommandWorkspacePlayback } from "@/hooks/commandWorkspace/useCommandWorkspacePlayback";
import { useSearchData } from "@/hooks/search/useSearchData";
import type {
  CommandWorkspaceSearchProps,
  CommandWorkspaceSearchFilter,
  CommandWorkspaceSearchItem,
} from "@/types/commandWorkspace/model";

export function useCommandWorkspaceSearch({
  onClose,
  onOpenTrackList,
}: CommandWorkspaceSearchProps) {
  const router = useSmartRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<CommandWorkspaceSearchFilter | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const category = getCommandWorkspaceCategory(filter);
  const opensSearchPage = category === "Lyrics" || category === "Sheets" || category === "MVs";
  const search = useSearchData(opensSearchPage ? "" : query, category);
  const openSearchPage = () => {
    if (!query.trim()) return;
    router.replace(buildCommandWorkspaceSearchHref(query.trim(), filter));
    onClose();
  };
  const { appendTracks, insertTracksNext, playSong, playVoice } = useCommandWorkspacePlayback();
  const items = useMemo(
    () =>
      getCommandWorkspaceSearchItems(
        {
          albums: search.albums,
          artists: search.artists,
          playlists: search.playlists,
          podcasts: search.podcasts,
          songs: search.songs,
          voices: search.voices,
        },
        category,
      ),
    [
      category,
      search.albums,
      search.artists,
      search.playlists,
      search.podcasts,
      search.songs,
      search.voices,
    ],
  );

  const selectItem = (item: CommandWorkspaceSearchItem) => {
    if (item.kind === "song") {
      void playSong(item.entity, search.songs);
      return;
    }
    if (item.kind === "voice") {
      void playVoice(item.entity, search.voices);
      return;
    }
    onOpenTrackList(item);
  };

  const appendItem = (item: CommandWorkspaceSearchItem) => {
    if (item.kind === "song") appendTracks([toCommandWorkspaceSongDetail(item.entity)]);
    if (item.kind === "voice" && item.entity.mainSong && item.entity.isPlayable !== false) {
      appendTracks([toVoiceSongDetail(item.entity.mainSong, item.entity.coverUrl, item.entity.id)]);
    }
  };

  const insertItemNext = (item: CommandWorkspaceSearchItem) => {
    if (item.kind === "song") insertTracksNext([toCommandWorkspaceSongDetail(item.entity)]);
    if (item.kind === "voice" && item.entity.mainSong && item.entity.isPlayable !== false) {
      insertTracksNext([
        toVoiceSongDetail(item.entity.mainSong, item.entity.coverUrl, item.entity.id),
      ]);
    }
  };

  return {
    inputRef,
    filter,
    setFilter,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    opensSearchPage,
    search,
    items,
    openSearchPage,
    selectItem,
    appendItem,
    insertItemNext,
  };
}
