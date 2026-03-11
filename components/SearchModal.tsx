'use client';

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { ScrollArea } from "./ui/scroll-area";


export const SearchModal = ({ isOpen, onClose, }: {
  isOpen: boolean;
  onClose: () => void;
}) => {

  const inputRef = useRef<HTMLInputElement>(null);
  const smartRouter = useSmartRouter();


  // 当弹窗打开时，自动将焦点移动到输入框上
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#242424] w-full max-w-2xl rounded-xl shadow-2xl border border-zinc-700/50 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // 阻止点击事件冒泡到外层容器导致意外关闭
      >
        <div className="flex items-center px-4 py-3 border-b border-zinc-700/50">
          <Search className="w-6 h-6 text-zinc-400" />
          <input
            ref={inputRef}
            className="w-full bg-transparent border-none text-white px-4 py-2 focus:outline-none text-lg placeholder-zinc-500"
            placeholder="What do you want to listen to?"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // 这里可以根据输入内容跳转到对应的页面
                // 或者调用一个回调函数处理搜索
                console.log("Enter pressed, search:", e.currentTarget.value);
                smartRouter.replace(`/search?query=${encodeURIComponent(e.currentTarget.value)}`);
              }
            }}
          />
          <div className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded shadow-inner font-bold whitespace-nowrap">
            Ctrl + K
          </div>
        </div>

        {/* Mock Search Results */}
        <ScrollArea className="p-4 max-h-[50vh] overflow-y-auto scrollbar-custom">
          <h3 className="text-zinc-400 text-sm font-bold mb-4">
            Recent searches
          </h3>
          <div className="">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full overflow-hidden ${item === 1 ? "bg-zinc-800" : "bg-linear-to-br from-indigo-500 to-purple-600"}`}
                  >
                    {item !== 1 && (
                      <img
                        src={`https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100&auto=format&fit=crop&sig=${item + 20}`}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {item === 1 ? "Justin Bieber" : `Discover Weekly ${item}`}
                    </span>
                    <span className="text-zinc-400 text-sm">
                      {item === 1 ? "Artist" : "Playlist"}
                    </span>
                  </div>
                </div>
                <button className="text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 p-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
