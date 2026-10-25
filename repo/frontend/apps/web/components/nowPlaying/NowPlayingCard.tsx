import { cn } from "@/lib/utils";
import type { NowPlayingCardProps } from "@/types/components/nowPlaying";

/** 正在播放面板中各信息块的统一卡片外壳。 */
export function NowPlayingCard({ title, action, children, className }: NowPlayingCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-lg bg-surface-raised", className)}>
      <header className="flex items-center justify-between gap-2 px-4 pt-4">
        <h3 className="truncate text-sm font-bold text-content">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}
