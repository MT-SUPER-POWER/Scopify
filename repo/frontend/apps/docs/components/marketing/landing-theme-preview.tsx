import { Home, Library, Radio, Search } from "lucide-react";

import { LandingAlbumCover } from "@/components/marketing/landing-album-cover";
import { LANDING_COVER_CROPS } from "@/constants/marketing";
import { themeGradient } from "@/lib/marketing/landing-palette";

interface LandingThemePreviewProps {
  bottom: string;
  intensity: number;
  themeName: string;
  top: string;
}

const NAV_ITEMS = [
  { icon: Home, label: "首页" },
  { icon: Search, label: "搜索" },
  { icon: Radio, label: "私人电台" },
  { icon: Library, label: "音乐库" },
] as const;

/** 用 HTML 搭出的客户端首页缩影：侧栏、主题渐变、问候语、真实专辑封面与播放栏。 */
export function LandingThemePreview({
  bottom,
  intensity,
  themeName,
  top,
}: LandingThemePreviewProps) {
  return (
    <div
      aria-label={`主题预览：${themeName}`}
      className="relative flex aspect-16/10 overflow-hidden rounded-[1.4rem] border border-white/12 bg-[#121212] shadow-[0_60px_140px_-30px_rgba(0,0,0,0.85)]"
    >
      <aside className="hidden w-[22%] shrink-0 flex-col gap-1 border-r border-white/6 bg-black/50 p-4 sm:flex">
        <p className="mb-4 text-sm font-bold text-white">Scopify</p>
        {NAV_ITEMS.map(({ icon: Icon, label }, index) => (
          <span
            key={label}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
              index === 0 ? "bg-white/10 text-white" : "text-white/50"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[78%] transition-[background-image,opacity] duration-700"
          style={{ backgroundImage: themeGradient(top, bottom), opacity: intensity / 100 }}
        />
        <div className="relative flex flex-1 flex-col p-5 sm:p-7">
          <p className="text-[0.62rem] font-medium tracking-[0.2em] text-white/60 uppercase">
            {themeName}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white sm:text-4xl">晚上好</p>
          <p className="mt-auto mb-3 text-sm font-bold text-white/90">为你推荐</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
            {LANDING_COVER_CROPS.map((crop, index) => (
              <LandingAlbumCover
                key={crop.x}
                crop={crop}
                className={`aspect-square rounded-md shadow-lg ${index > 2 ? "hidden sm:block" : ""}`}
              />
            ))}
          </div>
        </div>
        <div className="relative flex h-12 items-center gap-3 border-t border-white/6 bg-black/70 px-4">
          <LandingAlbumCover crop={LANDING_COVER_CROPS[1]!} className="size-7 rounded" />
          <span className="text-xs text-white/80">Touch · 3LAU</span>
          <span className="ml-auto h-1 w-1/3 overflow-hidden rounded-full bg-white/15">
            <span className="block h-full w-1/4 rounded-full bg-white" />
          </span>
        </div>
      </div>
    </div>
  );
}
