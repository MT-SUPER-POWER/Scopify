import { cn } from "@/lib/utils";
import type { QuietStateProps } from "@/types/components/quietState";

/** 空、未登录与失败状态共用的低调占位：淡图标 + 一行说明，可选一个次要操作。 */
export function QuietState({
  action,
  className,
  compact,
  description,
  icon: Icon,
  title,
}: QuietStateProps) {
  return (
    <div
      aria-live="polite"
      role="status"
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "min-h-40 py-8" : "min-h-96 py-16",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn("text-content-muted opacity-40", compact ? "mb-2 size-8" : "mb-3 size-12")}
      />
      <p className="text-sm text-content-muted">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-xs text-content-muted/70">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
