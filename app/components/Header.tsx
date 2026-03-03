import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, Bell, Users } from "lucide-react";

const Header = ({ onOpenSearch }: { onOpenSearch?: () => void }) => {
  return (
    <div
      className={cn(
        "h-16 w-full flex items-center justify-between px-6 shrink-0 absolute gap-2 lg:gap-0",
        "top-0 z-20 bg-linear-to-b from-black/60 to-transparent",
      )}
    >
      {/* Navigation Arrows & Search */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white cursor-not-allowed">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center text-zinc-400 hover:text-white cursor-not-allowed">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 搜索入口 */}
      <button
        onClick={onOpenSearch}
        className={cn(
          "flex items-center gap-2 bg-[#242424] hover:bg-[#2a2a2a] transition-colors rounded-full",
          "px-4 py-3 flex-1 max-w-150 sm:max-w-100 md:max-w-125 group",
          "cursor-pointer border border-transparent hover:border-zinc-700/50",
          "min-w-30",
        )}
      >
        <Search className="w-6 h-6 shrink-0 text-zinc-400 group-hover:text-white" />
        {/* TODO: 替换为 Input */}
        <span className="text-zinc-400 font-medium text-sm flex-1 text-left group-hover:text-white truncate">
          What do you want to play?
        </span>
        <div className="flex items-center gap-1 shrink-0 text-zinc-400 border border-zinc-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
          <span>Ctrl</span>
          <span>K</span>
        </div>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "px-4 py-[7.5] rounded-full",
            "bg-white text-black font-bold text-sm hover:scale-110 transition-transform",
            "hidden xl:block",
          )}
        >
          Premium
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-zinc-400 hover:text-white hover:scale-105 transition-transform">
          <Bell className="w-5 h-5" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-zinc-400 hover:text-white hover:scale-105 transition-transform">
          <Users className="w-5 h-5" />
        </button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white hover:scale-105 transition-transform border-[3px] border-black/70 hover:border-zinc-700">
          <div className="w-full h-full rounded-full bg-pink-600 flex items-center justify-center">
            <span className="text-xs font-bold">A</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Header;
