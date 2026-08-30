"use client";

import { CornerDownLeft, LoaderCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CommandWorkspaceQueryInput } from "@/components/commandWorkspace/CommandWorkspaceQueryInput";
import { CommandWorkspaceSearchResultList } from "@/components/commandWorkspace/CommandWorkspaceSearchResultList";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCommandWorkspaceCategory,
  getCommandWorkspaceSearchItems,
} from "@/lib/commandWorkspace/search";
import { toCommandWorkspaceSongDetail } from "@/lib/commandWorkspace/trackList";
import { toVoiceSongDetail } from "@/lib/search/voiceSong";
import { useCommandWorkspacePlayback } from "@/hooks/commandWorkspace/useCommandWorkspacePlayback";
import { useSearchData } from "@/hooks/search/useSearchData";
import type {
  CommandWorkspaceSearchFilter,
  CommandWorkspaceSearchItem,
} from "@/types/commandWorkspace";

interface CommandWorkspaceSearchProps {
  onOpenTrackList(item: CommandWorkspaceSearchItem): void;
}

export function CommandWorkspaceSearch({ onOpenTrackList }: CommandWorkspaceSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<CommandWorkspaceSearchFilter | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const category = getCommandWorkspaceCategory(filter);
  const search = useSearchData(query, category);
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

  return (
    <>
      <CommandWorkspaceQueryInput
        autoFocus
        filter={filter}
        inputRef={inputRef}
        onFilterChange={setFilter}
        onQueryChange={(nextQuery) => {
          setQuery(nextQuery);
          setSelectedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => (items.length ? (index + 1) % items.length : 0));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) =>
              items.length ? (index - 1 + items.length) % items.length : 0,
            );
          }
          if (event.key === "Enter" && items[selectedIndex]) {
            event.preventDefault();
            selectItem(items[selectedIndex]);
          }
        }}
        placeholder="搜索歌曲、歌手、专辑、歌单、播客与声音"
        query={query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <ScrollArea className="h-[min(52vh,32rem)]">
        {!query.trim() ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            输入关键词，或用 @ 筛选歌曲、歌手、专辑、歌单、播客与声音。
          </p>
        ) : search.loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
            <LoaderCircle className="size-4 animate-spin" />
            正在搜索
          </div>
        ) : (
          <CommandWorkspaceSearchResultList
            items={items}
            selectedIndex={selectedIndex}
            onSelect={selectItem}
            onAppend={appendItem}
            onInsertNext={insertItemNext}
          />
        )}
      </ScrollArea>
      <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
        <CornerDownLeft className="size-3.5 text-zinc-300" />
        Enter 播放歌曲 / 查看详情
        <span className="ml-auto">+ 加入队列</span>
      </footer>
    </>
  );
}
