import type React from "react";

interface LibraryPageHeaderProps {
  actions?: React.ReactNode;
  subtitle?: string;
  title: string;
}

export function LibraryPageHeader({ actions, subtitle, title }: LibraryPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-content">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-content-muted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
