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
    <span role="img" aria-label="Scopify" className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand-kits/smoky-jade/icon-128.png"
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
          className={cn("relative block aspect-11/2 w-28 min-w-0", wordmarkClassName)}
        >
          <Image
            src="/brand-kits/smoky-jade/wordmark-on-light.png"
            alt=""
            fill
            sizes="160px"
            priority={priority}
            className="object-contain dark:hidden"
          />
          <Image
            src="/brand-kits/smoky-jade/wordmark-on-dark.png"
            alt=""
            fill
            sizes="160px"
            priority={priority}
            className="hidden object-contain dark:block"
          />
        </span>
      )}
    </span>
  );
}
