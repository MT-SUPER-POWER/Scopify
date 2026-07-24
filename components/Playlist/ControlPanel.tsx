import { Menu, Pause, Play, Repeat, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COVER_URL =
  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop";

// 控制面板 (PC & Mobile 适配)
export default function ControlPanel({
  isPlaying,
  setIsPlaying,
  isDesktop = false,
}: {
  isPlaying: boolean;
  setIsPlaying: (b: boolean) => void;
  isDesktop?: boolean;
}) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-md">
      <div
        className={cn(
          "mb-6 flex items-center gap-4",
          isDesktop
            ? "justify-center text-center"
            : "justify-start text-left lg:justify-center lg:text-center",
        )}
      >
        {!isDesktop && (
          <img
            src={COVER_URL}
            alt="cover"
            className="size-12 rounded-md object-cover shadow-md ring-1 ring-white/10 lg:hidden"
          />
        )}
        <div
          className={cn(
            "flex flex-col",
            isDesktop ? "items-center" : "items-start lg:items-center",
          )}
        >
          <h1 className="mb-1 text-xl font-bold tracking-wide text-white drop-shadow-sm lg:text-[26px]">
            富士山下
          </h1>
          <p className="text-sm text-white/60 lg:text-[15px]">陈奕迅</p>
        </div>
      </div>

      <div className="mb-6 px-1">
        <div className="group relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/20">
          <div className="absolute top-0 left-0 h-full w-[30%] rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-[30%] -ml-1.5 size-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"></div>
        </div>
        <div className="flex justify-between text-[11px] font-medium text-white/50 tabular-nums">
          <span>01:16</span>
          <span>04:19</span>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between px-2 lg:mb-8">
        <button className="text-white/50 transition-colors hover:text-white">
          <Repeat className="size-5 lg:size-5" />
        </button>
        <button className="text-white/90 transition-opacity hover:text-white active:scale-95">
          <SkipBack className="size-8 fill-current lg:size-9" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex size-14 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all hover:scale-105 active:scale-95 lg:size-16"
        >
          {isPlaying ? (
            <Pause className="size-6 fill-current lg:size-7" />
          ) : (
            <Play className="ml-1 size-6 fill-current lg:size-7" />
          )}
        </button>
        <button className="text-white/90 transition-opacity hover:text-white active:scale-95">
          <SkipForward className="size-8 fill-current lg:size-9" />
        </button>
        <button className="text-white/50 transition-colors hover:text-white">
          <Menu className="size-5 lg:size-5" />
        </button>
      </div>

      <div
        className={cn(
          "items-center gap-3 px-3 text-white/50 transition-colors hover:text-white",
          isDesktop ? "flex" : "hidden lg:flex",
        )}
      >
        <Volume2 className="size-4" />
        <div className="h-1.5 w-full cursor-pointer rounded-full bg-white/20">
          <div className="h-full w-[60%] rounded-full bg-white/80"></div>
        </div>
      </div>
    </div>
  );
}
