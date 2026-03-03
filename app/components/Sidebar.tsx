"use client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Library, Plus, ArrowRight } from "lucide-react";
import playlist from "@/assets/data/playlist.json";
import artist from "@/assets/data/artist.json";
import { LibraryItem } from "./LibraryItem";
import { useReducer } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONSTANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UTILS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function reducer(
  _state: 0 | 1 | 2,
  action: { type: "ALL" | "PLAYLISTS" | "ARTISTS" },
) {
  switch (action.type) {
    case "ALL":
      return 0;
    case "PLAYLISTS":
      return 1;
    case "ARTISTS":
      return 2;
    default:
      throw new Error();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Sidebar = () => {
  const [state, dispatch] = useReducer(reducer, 0);

  return (
    <div className="w-75 flex flex-col gap-2 h-full shrink-0">
      {/* Library Card */}
      <div className="bg-[#121212] rounded-lg p-2 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 text-zinc-400 mb-2">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors font-semibold">
            <Library className="w-6 h-6" />
            <span>Your Library</span>
          </div>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 hover:text-white cursor-pointer hover:bg-[#1a1a1a] rounded-full p-0.5" />
            <ArrowRight className="w-5 h-5 hover:text-white cursor-pointer hover:bg-[#1a1a1a] rounded-full p-0.5" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 px-2 mb-4">
          <button
            onClick={() => dispatch({ type: "ALL" })}
            className="px-3 py-1 bg-[#242424] hover:bg-[#2a2a2a] rounded-full text-sm cursor-pointer transition-colors"
          >
            All
          </button>
          <button
            onClick={() => dispatch({ type: "PLAYLISTS" })}
            className="px-3 py-1 bg-[#242424] hover:bg-[#2a2a2a] rounded-full text-sm cursor-pointer transition-colors"
          >
            Playlists
          </button>
          <button
            onClick={() => dispatch({ type: "ARTISTS" })}
            className="px-3 py-1 bg-[#242424] hover:bg-[#2a2a2a] rounded-full text-sm cursor-pointer transition-colors"
          >
            Artists
          </button>
        </div>

        {/* Library List (Scrollable) */}
        <div
          className="flex-1 overflow-y-auto px-2 space-y-2
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-transparent
          hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {/* 显示播放列表 (ALL 和 PLAYLISTS 模式) */}
          {(state === 0 || state === 1) &&
            playlist.map((item) => (
              <LibraryItem
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                coverImg={item.coverImg}
              />
            ))}

          {/* 显示艺术家 (ALL 和 ARTISTS 模式) */}
          {(state === 0 || state === 2) &&
            artist.map((item) => (
              <LibraryItem
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                coverImg={item.coverImg}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
