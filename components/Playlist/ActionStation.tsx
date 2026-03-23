"use client";

import { Play, Pause, MoreHorizontal, Shuffle, ArrowDownCircle, List, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlayerStore, useUserStore } from "@/store";

interface PlaylistActionsProps {
  playlistId: string | null;
  isDaily: boolean;
  searchOpen: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function PlaylistActions(props: PlaylistActionsProps) {
  const { playlistId, isDaily, searchOpen, searchQuery, onSearchChange, onSearchOpen, onSearchClose, inputRef } = props;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const setShuffle = usePlayerStore((s) => s.setShuffle);
  const currentSongDetail = usePlayerStore((s) => s.currentSongDetail);
  const storePlaylistId = usePlayerStore((s) => s.playlistId);
  const albumList = useUserStore((s) => s.albumList);
  const currentPageId = playlistId ?? (isDaily ? "daily" : null);
  const isCurrentQueue = Boolean(storePlaylistId) && storePlaylistId === currentPageId;
  const showPause = isCurrentQueue && isPlaying; // 只有“是当前歌单”且“正在播放”时，才显示暂停键

  const handlePlayToggle = () => {
    const state = usePlayerStore.getState();
    if (!albumList.length) return;

    if (isCurrentQueue) {
      state.setIsPlaying(!state.isPlaying); // 如果已经是当前歌单，直接切换 播放/暂停 状态
    } else {
      // 否则，用当前页面的歌单替换播放队列，并从头播放 (复用 currentPageId)
      state.setQueue(albumList, 0, currentPageId);
      state.playQueueIndex(0);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-6">
      <div className="flex items-center gap-6">
        <button
          onClick={handlePlayToggle}
          disabled={!currentSongDetail && !albumList.length}
          className="bg-[#1ed760] hover:bg-[#3be477] hover:scale-105 transition-all text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showPause ? <Pause className="w-6 h-6 ml-0.5 fill-current" /> : <Play className="w-6 h-6 ml-1.5 fill-current" />}
        </button>

        <button onClick={() => setShuffle(!isShuffle)} className="relative inline-flex items-center justify-center cursor-pointer">
          <Shuffle className={cn("w-8 h-8 transition-colors", isShuffle ? "text-[#1ed760]" : "text-zinc-400 hover:text-white")} />
          {isShuffle && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1ed760] rounded-full" />}
        </button>

        <ArrowDownCircle className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
        {/* TODO: 实现更多选项
            1. 根据是歌单还是每日推荐 / 专辑 做区分
            2. 歌单：更新歌单封面、编辑歌单信息、分享歌单
            3. 专辑：分享专辑、收藏/取消收藏专辑
         */}
        <MoreHorizontal className="w-8 h-8 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
      </div>

      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-input"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1 overflow-hidden"
            >
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-white text-xs outline-none w-full placeholder:text-zinc-500"
              />
              <button onClick={onSearchClose}>
                <X className="w-3 h-3 text-zinc-400 hover:text-white shrink-0" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="search-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.05, ease: "linear" }}
              onClick={onSearchOpen}
            >
              <Search className="w-4 h-4 text-zinc-400 hover:text-white transition-colors cursor-pointer" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors font-medium">
          <span>List</span>
          <List className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
