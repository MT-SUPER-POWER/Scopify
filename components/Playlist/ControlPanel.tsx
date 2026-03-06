import { cn } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward, Repeat, Menu, Volume2 } from "lucide-react";

const COVER_URL = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop";

// 控制面板 (PC & Mobile 适配)
export default function ControlPanel({
    isPlaying,
    setIsPlaying,
    isDesktop = false
}: {
    isPlaying: boolean;
    setIsPlaying: (b: boolean) => void;
    isDesktop?: boolean;
}) {
    return (
        <div className="w-full max-w-md mx-auto relative z-10">
            <div className={cn(
                "flex items-center gap-4 mb-6",
                isDesktop ? "justify-center text-center" : "justify-start text-left lg:justify-center lg:text-center"
            )}>
                {!isDesktop && (
                    <img
                        src={COVER_URL}
                        alt="cover"
                        className="w-12 h-12 lg:hidden rounded-md object-cover shadow-md ring-1 ring-white/10"
                    />
                )}
                <div className={cn("flex flex-col", isDesktop ? "items-center" : "items-start lg:items-center")}>
                    <h1 className="text-xl lg:text-[26px] font-bold mb-1 tracking-wide text-white drop-shadow-sm">富士山下</h1>
                    <p className="text-white/60 text-sm lg:text-[15px]">陈奕迅</p>
                </div>
            </div>

            <div className="mb-6 px-1">
                <div className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer group mb-2 relative">
                    <div className="absolute left-0 top-0 h-full bg-white rounded-full w-[30%]"></div>
                    <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm -ml-1.5"></div>
                </div>
                <div className="flex justify-between text-[11px] text-white/50 font-medium tabular-nums">
                    <span>01:16</span>
                    <span>04:19</span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6 lg:mb-8 px-2">
                <button className="text-white/50 hover:text-white transition-colors">
                    <Repeat className="w-5 h-5 lg:w-5 lg:h-5" />
                </button>
                <button className="text-white/90 hover:text-white transition-opacity active:scale-95">
                    <SkipBack className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 lg:w-7 lg:h-7 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 lg:w-7 lg:h-7 fill-current ml-1" />
                    )}
                </button>
                <button className="text-white/90 hover:text-white transition-opacity active:scale-95">
                    <SkipForward className="w-8 h-8 lg:w-9 lg:h-9 fill-current" />
                </button>
                <button className="text-white/50 hover:text-white transition-colors">
                    <Menu className="w-5 h-5 lg:w-5 lg:h-5" />
                </button>
            </div>

            <div className={cn(
                "items-center gap-3 px-3 text-white/50 hover:text-white transition-colors",
                isDesktop ? "flex" : "hidden lg:flex"
            )}>
                <Volume2 className="w-4 h-4" />
                <div className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer">
                    <div className="h-full bg-white/80 rounded-full w-[60%]"></div>
                </div>
            </div>
        </div>
    );
}
