"use client";

import { ListMusic, Play, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDuration } from "@/lib/utils";
import { motion } from "framer-motion";

export const QueuePopover = () => {
  const { queue, queueIndex, playQueueIndex, isPlaying } = usePlayerStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hover:text-white transition-colors" title="播放队列">
          <ListMusic className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-0 bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-lg">当前队列</h3>
            <p className="text-xs text-zinc-400">共 {queue.length} 首歌曲</p>
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-1">
            {queue.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 text-sm">
                队列是空的
              </div>
            ) : (
              queue.map((song, index) => {
                const isActive = index === queueIndex;

                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => playQueueIndex(index)}
                    className={cn(
                      "group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all",
                      isActive ? "bg-white/10" : "hover:bg-white/5"
                    )}
                  >
                    {/* 左侧：索引与封面 */}
                    <div className="flex items-center gap-3 flex-shrink-0 pr-1">
                      <span className={cn(
                        "text-[10px] w-4 text-center tabular-nums",
                        isActive ? "text-[#1ed760]" : "text-zinc-500"
                      )}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>

                      <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded group/cover">
                        {/* 封面图片 */}
                        <img
                          src={song.al.picUrl}
                          alt={song.name}
                          className={cn(
                            "w-full h-full object-cover transition-opacity",
                            isActive ? "opacity-40" : "group-hover/cover:opacity-40"
                          )}
                        />

                        {/* 播放状态动画/图标 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isActive ? (
                            isPlaying ? (
                              <div className="flex items-end gap-[2px] h-3">
                                <motion.div
                                  animate={{ height: [4, 12, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                                  className="w-[3px] bg-[#1ed760]"
                                />
                                <motion.div
                                  animate={{ height: [4, 12, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.1 }}
                                  className="w-[3px] bg-[#1ed760]"
                                />
                                <motion.div
                                  animate={{ height: [4, 12, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut", delay: 0.2 }}
                                  className="w-[3px] bg-[#1ed760]"
                                />
                              </div>
                            ) : (
                              <Play className="w-4 h-4 text-[#1ed760] fill-current" />
                            )
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current opacity-0 group-hover/cover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 中间：歌曲信息 */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm truncate font-medium",
                        isActive ? "text-[#1ed760]" : "text-white"
                      )}>
                        {song.name}
                      </div>
                      <div className="text-xs text-zinc-400 truncate mt-0.5">
                        {song.ar.map(a => a.name).join(", ")}
                      </div>
                    </div>

                    {/* 右侧：时长 */}
                    <div className="text-xs text-zinc-500 tabular-nums pr-1">
                      {formatDuration(song.dt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
