import { Button } from "@scopify/ui/shadcn/components/button";

interface SidebarLibraryStateCardProps {
  actionLabel: string;
  onAction: () => void;
  subtitle: string;
  title: string;
}

export function SidebarLibraryStateCard({
  actionLabel,
  onAction,
  subtitle,
  title,
}: SidebarLibraryStateCardProps) {
  return (
    <div className="mx-1 flex flex-col items-start gap-4 rounded-lg bg-content/5 p-4">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-content">{title}</p>
        <p className="text-xs leading-5 text-pretty text-content-muted">{subtitle}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onAction}
        className="hover:scale-104h-8 rounded-full px-4 text-xs font-semibold transition-transform"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
