import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ScopifyBrandProps } from "@/types/components/brand";

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
      {/* 使用定稿的 Ivory S 圆标与原有粗斜体字标。 */}
      <Image
        src="/brand-kits/ivory/icon-128.png"
        alt=""
        width={128}
        height={128}
        sizes="48px"
        priority={priority}
        className={cn("size-8 shrink-0 object-contain", iconClassName)}
      />
      {withWordmark && (
        <span
          aria-hidden="true"
          className={cn("inline-grid min-w-0 shrink text-lg leading-none", wordmarkClassName)}
        >
          <Image
            src="/brand-kits/ivory/wordmark-on-light.png"
            alt=""
            width={990}
            height={180}
            sizes="160px"
            priority={priority}
            className="col-start-1 row-start-1 h-[1.1em] w-auto max-w-full object-contain dark:hidden"
          />
          <Image
            src="/brand-kits/ivory/wordmark-on-dark.png"
            alt=""
            width={990}
            height={180}
            sizes="160px"
            priority={priority}
            className="col-start-1 row-start-1 hidden h-[1.1em] w-auto max-w-full object-contain dark:block"
          />
        </span>
      )}
    </span>
  );
}
