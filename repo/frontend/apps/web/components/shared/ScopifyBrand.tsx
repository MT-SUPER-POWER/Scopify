import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ScopifyBrandProps } from "@/types/components/brand";

// tailwind-merge 会把任意值 font-[...] 当成 font-black 的冲突项吞掉，字体族改走 style
const WORDMARK_FONT = { fontFamily: '"Arial Black", Arial, sans-serif' };

export function ScopifyBrand({
  className,
  iconClassName,
  wordmarkClassName,
  withWordmark = true,
  priority = false,
}: ScopifyBrandProps) {
  return (
    <span
      role="img"
      aria-label="Scopify"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      {/* 小尺寸只用黑胶中心的扁平 S 圆标，完整黑胶外圈缩小后会融进深色背景 */}
      <Image
        src="/brand-kits/green-vinyl/mark-128.png"
        alt=""
        width={128}
        height={128}
        sizes="48px"
        priority={priority}
        className={cn("size-8 shrink-0 object-contain", iconClassName)}
      />
      {/* 延续旧字标的大写粗斜体，呼应 S 标的斜向笔势，但去掉做旧纹理 */}
      {withWordmark && (
        <span
          aria-hidden="true"
          className={cn(
            "min-w-0 truncate pr-0.5 text-lg leading-none font-black tracking-[0.01em] text-content italic",
            wordmarkClassName,
          )}
          style={WORDMARK_FONT}
        >
          SCOPIFY
        </span>
      )}
    </span>
  );
}
