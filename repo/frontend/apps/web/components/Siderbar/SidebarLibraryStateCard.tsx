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
    <div className="flex flex-col items-start gap-3 px-2 py-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-content">{title}</p>
        <p className="text-xs leading-5 text-content-muted">{subtitle}</p>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
