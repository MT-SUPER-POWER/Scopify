import { Button } from "@scopify/ui/shadcn/components/button";
import type { SidebarLibraryStateCardProps } from "@/types/sidebar/components";

export function SidebarLibraryStateCard({
  actionLabel,
  onAction,
  subtitle,
  title,
  icon: Icon,
  isCollapsed,
  busy,
}: SidebarLibraryStateCardProps) {
  if (isCollapsed) {
    const label = `${title} · ${actionLabel ?? subtitle}`;
    return onAction ? (
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={busy}
        onClick={onAction}
        className="mx-auto flex size-10 items-center justify-center rounded-lg text-content-muted hover:bg-content/10 hover:text-content disabled:opacity-50"
      >
        <Icon aria-hidden className="size-5" />
      </button>
    ) : (
      <div
        role="status"
        title={label}
        aria-label={label}
        className="flex h-10 items-center justify-center text-content-muted"
      >
        <Icon aria-hidden className="size-5" />
      </div>
    );
  }

  return (
    <div role="status" className="mx-1 mt-2 rounded-xl bg-content/4 p-3.5">
      <div className="flex items-center gap-2 text-content">
        <Icon aria-hidden className="size-4 shrink-0 text-content-muted" />
        <p className="text-sm leading-5 font-medium">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-pretty text-content-muted">{subtitle}</p>
      {onAction ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={onAction}
          className="mt-3 h-7 rounded-full bg-content/10 px-3.5 text-xs font-medium hover:bg-content/15"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
